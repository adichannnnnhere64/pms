<?php

namespace App\Http\Controllers;

use App\Models\Vessel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class VesselController extends Controller
{
    public function index()
    {
        \Illuminate\Support\Facades\Gate::authorize('vessels-view');
        $vessels = Vessel::latest()->paginate(10);

        return Inertia::render('vessels/Index', [
            'vessels' => $vessels,
        ]);
    }

    public function create()
    {
        \Illuminate\Support\Facades\Gate::authorize('vessels-create');
        return Inertia::render('vessels/Form');
    }

    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Gate::authorize('vessels-create');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:vessels,code',
        ]);

        Vessel::create($validated);

        return redirect()->route('vessels.index')->with('success', 'Vessel created successfully.');
    }

    public function edit(Vessel $vessel)
    {
        \Illuminate\Support\Facades\Gate::authorize('vessels-edit');
        return Inertia::render('vessels/Form', [
            'vessel' => $vessel,
        ]);
    }

    public function update(Request $request, Vessel $vessel)
    {
        \Illuminate\Support\Facades\Gate::authorize('vessels-edit');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('vessels', 'code')->ignore($vessel->id),
            ],
        ]);

        $vessel->update($validated);

        return redirect()->route('vessels.index')->with('success', 'Vessel updated successfully.');
    }

    public function destroy(Vessel $vessel)
    {
        \Illuminate\Support\Facades\Gate::authorize('vessels-delete');
        $vessel->delete();

        return redirect()->route('vessels.index')->with('success', 'Vessel deleted successfully.');
    }
}
