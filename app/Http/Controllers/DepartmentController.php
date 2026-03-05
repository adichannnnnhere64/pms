<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::withCount('users')
            ->orderBy('name')
            ->get();

        return Inertia::render('departments/Index', [
            'departments' => $departments,
        ]);
    }

    public function create()
    {
        return Inertia::render('departments/Form');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100|unique:departments,name',
        ]);

        Department::create($data);

        return redirect()->route('departments.index')->with('success', 'Department created');
    }

    public function edit(Department $department)
    {
        return Inertia::render('departments/Form', [
            'department' => $department,
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100|unique:departments,name,' . $department->id,
        ]);

        $department->update($data);

        return redirect()->route('departments.index')->with('success', 'Department updated');
    }

    public function destroy(Department $department)
    {
        $department->delete();

        return redirect()->route('departments.index')->with('success', 'Department deleted');
    }
}
