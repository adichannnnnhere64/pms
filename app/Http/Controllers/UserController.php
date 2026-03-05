<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        $usersQuery = User::with(['roles', 'departments'])->latest();

        $currentUser = request()->user();
        if ($currentUser && $currentUser->hasRole('encoder')) {
            $departmentIds = $currentUser->departments()->pluck('departments.id');
            $usersQuery->where(function ($query) use ($departmentIds, $currentUser) {
                if ($departmentIds->isEmpty()) {
                    $query->where('id', $currentUser->id);
                } else {
                    $query->whereHas('departments', function ($departmentQuery) use ($departmentIds) {
                        $departmentQuery->whereIn('departments.id', $departmentIds);
                    });
                }
            });
        }

        $users = $usersQuery->paginate(10);

        return Inertia::render('users/Index', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        $roles = Role::all();
        $departments = \App\Models\Department::orderBy('name')->get();

        return Inertia::render('users/Form', [
            'roles' => $roles,
            'departments' => $departments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'roles'    => ['required', 'array', 'min:1'],
            'roles.*'  => ['required', Rule::exists('roles', 'name')],
            'departments' => ['nullable', 'array'],
            'departments.*' => ['required', Rule::exists('departments', 'id')],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole($validated['roles']);
        $user->departments()->sync($validated['departments'] ?? []);

        return redirect()->route('users.index')->with('success', 'User berhasil dibuat.');
    }

    public function edit(User $user)
    {
        $roles = Role::all();
        $departments = \App\Models\Department::orderBy('name')->get();

        return Inertia::render('users/Form', [
            'user'         => $user->only(['id', 'name', 'email']),
            'roles'        => $roles,
            'departments'  => $departments,
            'currentRoles' => $user->roles->pluck('name')->toArray(), // multiple roles
            'currentDepartments' => $user->departments->pluck('id')->toArray(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'roles'    => ['required', 'array', 'min:1'],
            'roles.*'  => ['required', Rule::exists('roles', 'name')],
            'departments' => ['nullable', 'array'],
            'departments.*' => ['required', Rule::exists('departments', 'id')],
        ]);

        $user->update([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => $validated['password']
                ? Hash::make($validated['password'])
                : $user->password,
        ]);

        $user->syncRoles($validated['roles']);
        $user->departments()->sync($validated['departments'] ?? []);

        return redirect()->route('users.index')->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('users.index')->with('success', 'User berhasil dihapus.');
    }

    public function resetPassword(User $user)
    {
        $user->update([
            'password' => Hash::make('ResetPasswordNya'),
        ]);

        return redirect()->back()->with('success', 'Password berhasil direset ke default.');
    }
}
