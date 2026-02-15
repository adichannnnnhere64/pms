<?php

namespace App\Http\Controllers;

use App\Models\AccountabilityPaymentVoucher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    /**
     * Display workflow dashboard
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        \Log::info('hello');

        // Get APVs pending user action based on role
        $pendingApprovals = AccountabilityPaymentVoucher::query()
            ->when($user->hasRole('encoder') || true, function ($query) {
                // Encoder sees their own drafts and rejected items
                $query->where('requested_by', auth()->id())
                    ->whereIn('status', ['draft', 'rejected']);
            })
            ->when($user->hasRole('manager'), function ($query) {
                // Manager sees items pending approval
                $query->where('status', 'pending_approval');
            })
            ->when($user->hasAnyRole(['director', 'finance']), function ($query) {
                // Director/Finance sees approved items pending release
                $query->where('status', 'approved');
            })
            ->with(['requester', 'particulars'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Get in-progress items for user
        $myRequests = AccountabilityPaymentVoucher::query()
            ->where('requested_by', auth()->id())
            ->whereNotIn('status', ['completed', 'rejected'])
            ->with(['particulars'])
            ->orderBy('created_at', 'desc')
            ->paginate(15, ['*'], 'myRequestsPage');

        // Get completed history
        $completed = AccountabilityPaymentVoucher::query()
            ->where('requested_by', auth()->id())
            ->whereIn('status', ['completed', 'rejected'])
            ->with(['approver', 'releasedBy', 'particulars'])
            ->orderBy('updated_at', 'desc')
            ->paginate(15, ['*'], 'historyPage');

        return Inertia::render('Workflow/Index', [
            'pendingApprovals' => $pendingApprovals,
            'myRequests' => $myRequests,
            'completed' => $completed,
            'userRoles' => $user->getRoleNames(),
            'workflowStats' => $this->getWorkflowStats($user),
        ]);
    }

    /**
     * Show form to create new APV
     */
    public function create(): Response
    {

/* auth()->user()->roles->pluck('name') */
        return Inertia::render('Workflow/CreateApv', [
            'vendorOptions' => $this->getVendorOptions(),
            'particularOptions' => $this->getParticularOptions(),
            'currentUserRoles' =>  ['Operations'],
            'categoryOptions' => [
                'office_supplies' => 'Office Supplies',
                'furniture' => 'Furniture',
                'equipment' => 'Equipment',
                'software' => 'Software',
                'services' => 'Services',
                'travel' => 'Travel',
                'utilities' => 'Utilities',
                'other' => 'Other',
            ],
        ]);
    }

    /**
     * Store new APV
     */
    public function store(Request $request)
    {

        $validated = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'is_priority' => 'required|boolean',
            'particular' => 'required|string',
            'notes' => 'nullable|string',
            'expected_date' => 'required|date|after:today',
            'particulars' => 'required|array|min:1',
            'particulars.*.description' => 'required|string',
            'particulars.*.category' => 'required|string',
            'particulars.*.quantity' => 'required|integer|min:1',
            'particulars.*.unit_price' => 'required|numeric|min:0',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);


        try {
            \DB::beginTransaction();

            // Create APV
            $apv = AccountabilityPaymentVoucher::create([
                'requested_by' => auth()->id(),
                'vendor_name' => $validated['vendor_name'],
                'is_priority' =>(boolean)$validated['is_priority'],
                'particular' =>$validated['particular'],
                'department' => $validated['department'],
                'notes' => $validated['notes'],
                'expected_date' => $validated['expected_date'],
                'status' => 'draft',
            ]);

            // Create particulars
            foreach ($validated['particulars'] as $item) {
                $apv->particulars()->create($item);
            }

            // Handle attachments
            $attachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('apv-attachments', 'public');
                    $attachments[] = [
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'type' => $file->getMimeType(),
                    ];
                }
                $apv->update(['attachments' => $attachments]);
            }

            // Calculate total
            $apv->update(['total_amount' => $apv->computed_total]);

            \DB::commit();

            return redirect()->route('workflow.show', $apv->id)
                ->with('success', 'APV created successfully');
        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create APV: ' . $e->getMessage()]);
        }
    }

    /**
     * Show single APV with workflow actions
     */
    public function show(AccountabilityPaymentVoucher $apv): Response
    {
        $apv->load(['requester', 'approver', 'releasedBy', 'particulars']);

        // Get workflow state
        $workflow = $apv->workflow();
        $availableTransitions = $workflow->getAvailableTransitions($apv);
        $history = $workflow->getHistory($apv);

        // Check user permissions for this APV
        $canEdit = $apv->status === 'draft' && auth()->id() === $apv->requested_by;
        $canSubmit = auth()->user()->can('workflow.can_submit') && $apv->status === 'draft';
        $canApprove = auth()->user()->can('workflow.can_approve') && $apv->status === 'pending_approval';
        $canReject = auth()->user()->can('workflow.can_approve') && in_array($apv->status, ['pending_approval', 'approved']);
        $canRelease = auth()->user()->can('workflow.can_release') && $apv->status === 'approved';

        return Inertia::render('Workflow/ShowApv', [
            'apv' => $apv,
            'availableTransitions' => $availableTransitions,
            'history' => $history,
            'canEdit' => $canEdit,
            'canSubmit' => $canSubmit,
            'canApprove' => $canApprove,
            'canReject' => $canReject,
            'canRelease' => $canRelease,
            'workflowStates' => [
                'draft' => ['label' => 'Pending', 'color' => 'gray'],
                'pending_approval' => ['label' => 'Pending Approval', 'color' => 'yellow'],
                'approved' => ['label' => 'Approved', 'color' => 'green'],
                'rejected' => ['label' => 'Rejected', 'color' => 'red'],
                'completed' => ['label' => 'Completed', 'color' => 'blue'],
            ],
        ]);
    }

    /**
     * Apply workflow transition
     */
    public function transition(Request $request, AccountabilityPaymentVoucher $apv)
    {
        $validated = $request->validate([
            'transition' => 'required|string',
            'rejected_reason' => 'required_if:transition,reject,reject_after_approval|string|nullable',
            'attachments' => 'required_if:transition,submit|array|nullable',
        ]);

        try {
            $context = match ($validated['transition']) {
                'submit' => ['attachments' => $validated['attachments'] ?? []],
                'reject', 'reject_after_approval' => ['rejected_reason' => $validated['rejected_reason']],
                default => [],
            };

            $transition = $apv->transition($validated['transition'], $context);

            return back()->with('success', "APV {$validated['transition']} successful");
        } catch (\DomainException $e) {
            return back()->withErrors(['transition' => $e->getMessage()]);
        }
    }

    /**
     * Get workflow statistics
     */
    private function getWorkflowStats($user): array
    {
        return [
            'pending_approval' => AccountabilityPaymentVoucher::where('status', 'pending_approval')->count(),
            'approved' => AccountabilityPaymentVoucher::where('status', 'approved')->count(),
            'my_drafts' => AccountabilityPaymentVoucher::where('requested_by', $user->id)
                ->where('status', 'draft')
                ->count(),
            'my_pending' => AccountabilityPaymentVoucher::where('requested_by', $user->id)
                ->where('status', 'pending_approval')
                ->count(),
        ];
    }

    /**
     * Get vendor options (you can replace with actual vendor model)
     */
    private function getVendorOptions(): array
    {
        return [
            ['value' => 'sta_maria', 'label' => 'MV Sta. Maria'],
            ['value' => 'sta_editha', 'label' => 'MV Sta. Editha'],
            ['value' => 'starlight_express', 'label' => 'Starlight Express'],
            ['value' => 'montenegro', 'label' => 'Montenegro'],
        ];
    }

    private function getParticularOptions(): array
    {
        return [
            ['value' => 'safety_equipments', 'label' => 'Safety Equipments'],
            ['value' => 'payroll', 'label' => 'Payroll'],
            ['value' => 'bonus', 'label' => 'Bonus'],
            ['value' => 'repairs', 'label' => 'Repairs'],
        ];
    }
}
