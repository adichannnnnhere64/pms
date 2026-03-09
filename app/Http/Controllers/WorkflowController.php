<?php

namespace App\Http\Controllers;

use Adichan\WorkflowEngine\Models\WorkflowSignoff;
use Adichan\WorkflowEngine\Models\WorkflowTransition;
use App\Models\AccountabilityPaymentVoucher;
use App\Models\DesignatedApprover;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    /**
     * Display workflow dashboard
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $userId = auth()->id();

        // Check if user is a designated approver or releaser
        $isDesignatedApprover = DesignatedApprover::isDesignatedApprover($userId);
        $isDesignatedReleaser = DesignatedApprover::isDesignatedReleaser($userId);

        // Get APVs pending user action based on role OR designated status
        $pendingApprovals = AccountabilityPaymentVoucher::query()
            ->when($user->hasRole('encoder') && !$isDesignatedApprover && !$isDesignatedReleaser, function ($query) use ($userId) {
                $query->where('requested_by', $userId)
                    ->whereIn('status', ['draft', 'rejected']);
            })
            ->when($user->hasRole('manager') || $isDesignatedApprover, function ($query) {
                // Manager or designated approver sees items pending approval
                $query->where('status', 'pending_approval');
            })
            ->when($user->hasAnyRole(['director', 'finance']) || $isDesignatedReleaser, function ($query) {
                // Director/Finance or designated releaser sees approved items pending release
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

        // Get completed history (for requesters)
        $completed = AccountabilityPaymentVoucher::query()
            ->where('requested_by', auth()->id())
            ->whereIn('status', ['completed', 'rejected'])
            ->with(['approver', 'releasedBy', 'particulars'])
            ->orderBy('updated_at', 'desc')
            ->paginate(15, ['*'], 'historyPage');

        // Get action history - forms where current user has taken action (approved, rejected, released)
        $actionHistoryIds = WorkflowTransition::where('performed_by', auth()->id())
            ->where('model_type', AccountabilityPaymentVoucher::class)
            ->whereIn('transition', ['approve', 'reject', 'reject_after_approval', 'release'])
            ->pluck('model_id')
            ->unique();

        $actionHistory = AccountabilityPaymentVoucher::query()
            ->whereIn('id', $actionHistoryIds)
            ->with(['requester', 'approver', 'releasedBy', 'particulars'])
            ->orderBy('updated_at', 'desc')
            ->paginate(15, ['*'], 'actionHistoryPage');

        // Add designated approver/releaser to roles for UI display
        $effectiveRoles = $user->getRoleNames()->toArray();
        if ($isDesignatedApprover && !in_array('manager', $effectiveRoles)) {
            $effectiveRoles[] = 'manager'; // Treat as manager in UI
        }
        if ($isDesignatedReleaser && !in_array('director', $effectiveRoles) && !in_array('finance', $effectiveRoles)) {
            $effectiveRoles[] = 'finance'; // Treat as finance in UI
        }

        return Inertia::render('Workflow/Index', [
            'pendingApprovals' => $pendingApprovals,
            'myRequests' => $myRequests,
            'completed' => $completed,
            'actionHistory' => $actionHistory,
            'userRoles' => $effectiveRoles,
            'workflowStats' => $this->getWorkflowStats($user),
        ]);
    }

    /**
     * Show form to create new APV
     */
    public function create(): Response
    {
        Gate::authorize('workflow.apv.can_submit');

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
     * Show form to edit APV
     */
    public function edit(AccountabilityPaymentVoucher $apv): Response
    {
        $this->authorizeEdit($apv);

        $apv->load(['particulars']);

        return Inertia::render('Workflow/EditApv', [
            'apv' => $apv,
            'vendorOptions' => $this->getVendorOptions(),
            'particularOptions' => $this->getParticularOptions(),
            'currentUserRoles' => auth()->user()->roles->pluck('name')->toArray(),
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
        Gate::authorize('workflow.apv.can_submit');

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
                ->with('success', 'RAF created successfully');
        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create APV: ' . $e->getMessage()]);
        }
    }

    /**
     * Update existing APV
     */
    public function update(Request $request, AccountabilityPaymentVoucher $apv)
    {
        $this->authorizeEdit($apv);

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
            'existing_attachments' => 'array|nullable',
            'existing_attachments.*.name' => 'required|string',
            'existing_attachments.*.path' => 'required|string',
            'existing_attachments.*.size' => 'required|integer',
            'existing_attachments.*.type' => 'required|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        try {
            \DB::beginTransaction();

            $apv->update([
                'vendor_name' => $validated['vendor_name'],
                'is_priority' => (bool) $validated['is_priority'],
                'particular' => $validated['particular'],
                'department' => $validated['department'],
                'notes' => $validated['notes'],
                'expected_date' => $validated['expected_date'],
            ]);

            $apv->particulars()->delete();
            foreach ($validated['particulars'] as $item) {
                $apv->particulars()->create($item);
            }

            $attachments = $validated['existing_attachments'] ?? [];
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
            }
            $apv->update([
                'attachments' => $attachments,
                'total_amount' => $apv->computed_total,
            ]);

            \DB::commit();

            return redirect()->route('workflow.show', $apv->id)
                ->with('success', 'RAF updated successfully');
        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update APV: ' . $e->getMessage()]);
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
        $history = collect($workflow->getHistory($apv));
        $performerIds = $history->pluck('performed_by')->filter()->unique()->values();
        $performers = \App\Models\User::with(['roles:id,name', 'departments:id,name'])
            ->whereIn('id', $performerIds)
            ->get()
            ->keyBy('id');

        $history = $history->map(function ($item) use ($performers) {
            $user = $performers->get($item['performed_by']);
            $item['performer'] = $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray(),
                'departments' => $user->departments->pluck('name')->toArray(),
                'created_at' => optional($user->created_at)->toISOString(),
            ] : null;

            return $item;
        });

        // Check user permissions for this APV (including designated approvers)
        $user = auth()->user();
        $userId = auth()->id();
        $isDesignatedApprover = DesignatedApprover::isDesignatedApprover($userId);
        $isDesignatedReleaser = DesignatedApprover::isDesignatedReleaser($userId);

        $canEdit = $apv->status === 'draft' && $userId === $apv->requested_by;
        $canSubmit = $user->can('apv.submit') && $apv->status === 'draft';

        // Get signoff information first (needed for canApprove check)
        $signoffData = $this->getSignoffData($apv, $userId);

        // Allow approvers to sign if:
        // 1. Status is pending_approval, OR
        // 2. Status is approved AND user is a required approver who hasn't signed yet
        $canApproveNormally = ($user->can('apv.approve') || $isDesignatedApprover) && $apv->status === 'pending_approval';
        $canSignAsRequiredApprover = $isDesignatedApprover
            && $apv->status === 'approved'
            && !$signoffData['user_has_signed']
            && $this->isRequiredApprover($userId);
        $canApprove = $canApproveNormally || $canSignAsRequiredApprover;

        $canReject = ($user->can('apv.reject') || $isDesignatedApprover || $isDesignatedReleaser) && in_array($apv->status, ['pending_approval', 'approved']);
        $canRelease = ($user->can('apv.release') || $isDesignatedReleaser) && $apv->status === 'approved';

        return Inertia::render('Workflow/ShowApv', [
            'apv' => $apv,
            'availableTransitions' => $availableTransitions,
            'history' => $history->values(),
            'canEdit' => $canEdit,
            'canSubmit' => $canSubmit,
            'canApprove' => $canApprove,
            'canReject' => $canReject,
            'canRelease' => $canRelease,
            'signoffs' => $signoffData,
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
            /* 'attachments' => 'required_if:transition,submit|array|nullable', */
            'comment' => 'nullable|string|max:500',
            'attachments' => 'array|nullable',
            'attachments.*' => 'file|mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx|max:10240',
        ]);


        try {
            // Check required signoffs before release
            if ($validated['transition'] === 'release') {
                $this->validateRequiredApprovers($apv);
            }

            $releaseAttachments = [];
            if ($validated['transition'] === 'release' && $request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('apv-release-attachments', 'public');
                    $releaseAttachments[] = [
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'type' => $file->getClientMimeType(),
                    ];
                }
            }

            $context = match ($validated['transition']) {
                'submit' => ['attachments' => $validated['attachments'] ?? []],
                'reject', 'reject_after_approval' => ['rejected_reason' => $validated['rejected_reason']],
                'release' => [
                    'comment' => $validated['comment'] ?? null,
                    'attachments' => $releaseAttachments,
                ],
                default => [],
            };

            // Record signoff when approving
            if ($validated['transition'] === 'approve') {
                $workflow = $apv->workflow();
                $workflow->recordSignoff(
                    $apv,
                    auth()->id(),
                    'approver',
                    $validated['comment'] ?? null
                );

                // If already approved, just record signoff without transitioning
                if ($apv->status === 'approved') {
                    return back()->with('success', 'Your approval has been recorded');
                }
            }

            $transition = $apv->transition($validated['transition'], $context);

            return back()->with('success', "RAF {$validated['transition']} successful");
        } catch (\DomainException $e) {
            return back()->withErrors(['transition' => $e->getMessage()]);
        }
    }

    /**
     * Validate that all required approvers have signed off.
     */
    private function validateRequiredApprovers(AccountabilityPaymentVoucher $apv): void
    {
        $requiredApprovers = DesignatedApprover::getRequiredApprovers();

        if ($requiredApprovers->isEmpty()) {
            return; // No required approvers configured
        }

        $requiredUserIds = $requiredApprovers->pluck('user_id')->toArray();
        $workflow = $apv->workflow();

        $missingSignoffs = $workflow->getMissingSignoffs($apv, 'approver', $requiredUserIds);

        if (!empty($missingSignoffs)) {
            // Get names of missing approvers
            $missingApprovers = $requiredApprovers
                ->whereIn('user_id', $missingSignoffs)
                ->map(fn ($a) => $a->user->name . ($a->title ? " ({$a->title})" : ''))
                ->implode(', ');

            throw new \DomainException(
                "Cannot release. Missing required approvals from: {$missingApprovers}"
            );
        }
    }

    /**
     * Get workflow statistics
     */
    private function getWorkflowStats($user): array
    {
        $myActionCount = WorkflowTransition::where('performed_by', $user->id)
            ->where('model_type', AccountabilityPaymentVoucher::class)
            ->whereIn('transition', ['approve', 'reject', 'reject_after_approval', 'release'])
            ->distinct('model_id')
            ->count('model_id');

        // Check designated approver/releaser status
        $isDesignatedApprover = DesignatedApprover::isDesignatedApprover($user->id);
        $isDesignatedReleaser = DesignatedApprover::isDesignatedReleaser($user->id);

        // Count pending items for current user based on role OR designated status
        $pendingMyAction = 0;
        if ($user->hasRole('manager') || $isDesignatedApprover) {
            $pendingMyAction = AccountabilityPaymentVoucher::where('status', 'pending_approval')->count();
        } elseif ($user->hasAnyRole(['director', 'finance']) || $isDesignatedReleaser) {
            $pendingMyAction = AccountabilityPaymentVoucher::where('status', 'approved')->count();
        }

        return [
            'pending_approval' => AccountabilityPaymentVoucher::where('status', 'pending_approval')->count(),
            'approved' => AccountabilityPaymentVoucher::where('status', 'approved')->count(),
            'my_drafts' => AccountabilityPaymentVoucher::where('requested_by', $user->id)
                ->where('status', 'draft')
                ->count(),
            'my_pending' => AccountabilityPaymentVoucher::where('requested_by', $user->id)
                ->where('status', 'pending_approval')
                ->count(),
            'my_actions' => $myActionCount,
            'pending_my_action' => $pendingMyAction,
        ];
    }

    /**
     * Get vendor options (now dynamic from Vessel model)
     */
    private function getVendorOptions(): array
    {
        return \App\Models\Vessel::orderBy('name')
            ->get(['name'])
            ->map(fn($vessel) => [
                'value' => $vessel->name,
                'label' => $vessel->name
            ])
            ->toArray();
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

    private function authorizeEdit(AccountabilityPaymentVoucher $apv): void
    {
        if ($apv->status !== 'draft' || $apv->requested_by !== auth()->id()) {
            abort(403);
        }
    }

    /**
     * Get signoff data for display.
     */
    private function getSignoffData(AccountabilityPaymentVoucher $apv, ?int $userId = null): array
    {
        $workflow = $apv->workflow();

        // Get all designated approvers with their signoff status
        $designatedApprovers = DesignatedApprover::getApprovers();
        $approverSignoffUserIds = $workflow->getSignoffUserIds($apv, 'approver');

        $approvers = $designatedApprovers->map(function ($approver) use ($approverSignoffUserIds, $workflow, $apv) {
            $hasSigned = in_array($approver->user_id, $approverSignoffUserIds);
            $signoff = null;

            if ($hasSigned) {
                $signoff = WorkflowSignoff::where('model_type', get_class($apv))
                    ->where('model_id', $apv->id)
                    ->where('user_id', $approver->user_id)
                    ->where('signoff_type', 'approver')
                    ->first();
            }

            return [
                'id' => $approver->id,
                'user_id' => $approver->user_id,
                'user_name' => $approver->user->name,
                'title' => $approver->title,
                'is_required' => $approver->is_required,
                'has_signed' => $hasSigned,
                'signed_at' => $signoff?->signed_at?->toISOString(),
                'comments' => $signoff?->comments,
            ];
        });

        // Get required approvers that haven't signed
        $requiredApprovers = DesignatedApprover::getRequiredApprovers();
        $requiredUserIds = $requiredApprovers->pluck('user_id')->toArray();
        $missingRequired = $workflow->getMissingSignoffs($apv, 'approver', $requiredUserIds);

        // Check if current user has already signed
        $userHasSigned = $userId ? in_array($userId, $approverSignoffUserIds) : false;

        return [
            'approvers' => $approvers->values(),
            'required_complete' => empty($missingRequired),
            'missing_required_count' => count($missingRequired),
            'total_signoffs' => count($approverSignoffUserIds),
            'user_has_signed' => $userHasSigned,
        ];
    }

    /**
     * Check if user is a required approver.
     */
    private function isRequiredApprover(int $userId): bool
    {
        return DesignatedApprover::getRequiredApprovers()
            ->contains('user_id', $userId);
    }

    /**
     * Download RAF as PDF
     */
    public function downloadPdf(AccountabilityPaymentVoucher $apv)
    {
        $apv->load(['requester', 'approver', 'releasedBy', 'particulars']);

        $config = config('raf');

        // Get designated approvers and releasers for signature section
        $designatedApprovers = DesignatedApprover::getApprovers();
        $designatedReleasers = DesignatedApprover::getReleasers();

        $pdf = Pdf::loadView('pdf.raf', [
            'apv' => $apv,
            'config' => $config,
            'designatedApprovers' => $designatedApprovers,
            'designatedReleasers' => $designatedReleasers,
        ]);

        $pdf->setPaper(
            $config['pdf']['paper_size'],
            $config['pdf']['orientation']
        );

        $filename = sprintf(
            '%s-%s.pdf',
            $config['pdf']['filename_prefix'],
            $apv->reference_number
        );

        return $pdf->download($filename);
    }
}
