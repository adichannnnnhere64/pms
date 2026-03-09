<?php

namespace App\Http\Controllers;

use App\Models\DesignatedApprover;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DesignatedApproverController extends Controller
{
    /**
     * Display the approvers management page.
     */
    public function index(): Response
    {
        $approvers = DesignatedApprover::with('user')
            ->ofType(DesignatedApprover::TYPE_APPROVER)
            ->orderBy('order')
            ->get();

        $releasers = DesignatedApprover::with('user')
            ->ofType(DesignatedApprover::TYPE_RELEASER)
            ->orderBy('order')
            ->get();

        // Get users that can be selected (exclude already assigned ones per type)
        $approverUserIds = $approvers->pluck('user_id')->toArray();
        $releaserUserIds = $releasers->pluck('user_id')->toArray();

        $availableUsers = User::orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('DesignatedApprovers/Index', [
            'approvers' => $approvers,
            'releasers' => $releasers,
            'availableUsers' => $availableUsers,
            'approverUserIds' => $approverUserIds,
            'releaserUserIds' => $releaserUserIds,
        ]);
    }

    /**
     * Store a new designated approver.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'approval_type' => 'required|in:approver,releaser',
            'title' => 'nullable|string|max:255',
            'is_required' => 'boolean',
        ]);

        // Check if already exists
        $exists = DesignatedApprover::where('user_id', $validated['user_id'])
            ->where('approval_type', $validated['approval_type'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['user_id' => 'This user is already a designated ' . $validated['approval_type'] . '.']);
        }

        // Get the max order for this type
        $maxOrder = DesignatedApprover::ofType($validated['approval_type'])->max('order') ?? 0;

        DesignatedApprover::create([
            'user_id' => $validated['user_id'],
            'approval_type' => $validated['approval_type'],
            'title' => $validated['title'],
            'order' => $maxOrder + 1,
            'is_required' => $validated['is_required'] ?? false,
            'is_active' => true,
        ]);

        return back()->with('success', 'Designated ' . $validated['approval_type'] . ' added successfully.');
    }

    /**
     * Update a designated approver.
     */
    public function update(Request $request, DesignatedApprover $designatedApprover): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'is_required' => 'boolean',
            'order' => 'integer|min:0',
        ]);

        $designatedApprover->update($validated);

        return back()->with('success', 'Updated successfully.');
    }

    /**
     * Remove a designated approver.
     */
    public function destroy(DesignatedApprover $designatedApprover): RedirectResponse
    {
        $type = $designatedApprover->approval_type;
        $designatedApprover->delete();

        return back()->with('success', 'Designated ' . $type . ' removed successfully.');
    }

    /**
     * Reorder approvers.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:designated_approvers,id',
            'items.*.order' => 'required|integer|min:0',
        ]);

        foreach ($validated['items'] as $item) {
            DesignatedApprover::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return back()->with('success', 'Order updated successfully.');
    }
}
