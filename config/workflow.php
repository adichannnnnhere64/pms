<?php

/*
|--------------------------------------------------------------------------
| APV Workflow — config/workflow.php  (merge this into your existing file)
|--------------------------------------------------------------------------
|
| Flow:
|   draft ──submit──► pending_approval ──approve──► approved ──release──► completed
|                           │                           │
|                        reject                      reject
|                           ▼                           ▼
|                        rejected                   rejected
|
| Roles required (add to your User model / roles system):
|   • employee  – can create and submit APVs
|   • approver  – validates the request (step 2)
|   • finance   – releases the payment (step 3)
|
*/

return [

    // -------------------------------------------------------------------------
    // Paste this block inside  'workflows' => [...]  in your workflow.php
    // -------------------------------------------------------------------------
    'apv' => [

        'state_column' => 'status',

        // -----------------------------------------------------------------
        // States
        // -----------------------------------------------------------------
        'states' => [
            [
                'value'      => 'draft',
                'label'      => 'Pending',
                'is_initial' => true,
                'is_final'   => false,
            ],
            [
                'value'      => 'pending_approval',
                'label'      => 'Pending Approval',
                'is_initial' => false,
                'is_final'   => false,
            ],
            [
                'value'      => 'approved',
                'label'      => 'Approved',
                'is_initial' => false,
                'is_final'   => false,
            ],
            [
                'value'      => 'rejected',
                'label'      => 'Rejected',
                'is_initial' => false,
                'is_final'   => true,
            ],
            [
                'value'      => 'completed',
                'label'      => 'Completed',
                'is_initial' => false,
                'is_final'   => true,
            ],
        ],

        // -----------------------------------------------------------------
        // Transitions
        // -----------------------------------------------------------------
        'transitions' => [

            // Step 1 — Requestor submits the form
            [
                'name'      => 'submit',
                'from'      => 'draft',
                'to'        => 'pending_approval',
                'guard'     => 'workflow.can_submit',
                // Must have at least one attachment and one particular
                'validator' => function (array $context): bool {
                    return ! empty($context['attachments']);
                },
            ],

            // Step 2 — Approver validates and signs off
            [
                'name'  => 'approve',
                'from'  => 'pending_approval',
                'to'    => 'approved',
                'guard' => 'workflow.can_approve',
            ],

            // Step 2 — Approver can send back to the requestor
            [
                'name'      => 'reject',
                'from'      => 'pending_approval',
                'to'        => 'rejected',
                'guard'     => 'workflow.can_approve',
                'validator' => function (array $context): bool {
                    return ! empty($context['rejected_reason']);
                },
            ],

            // Step 3 — Finance releases the payment
            [
                'name'  => 'release',
                'from'  => 'approved',
                'to'    => 'completed',
                'guard' => 'workflow.can_process_payment',
            ],

            // Finance can also reject an already-approved APV (edge-case)
            [
                'name'      => 'reject_after_approval',
                'from'      => 'approved',
                'to'        => 'rejected',
                'guard'     => 'workflow.can_process_payment',
                'validator' => function (array $context): bool {
                    return ! empty($context['rejected_reason']);
                },
            ],
        ],

        // -----------------------------------------------------------------
        // Hooks
        // -----------------------------------------------------------------
        'hooks' => [
            'before' => [
                'submit' => function (\Illuminate\Database\Eloquent\Model $model, string $from, string $to, array $context): void {
                    // Guard: APV must have at least one line-item
                    if ($model->particulars()->count() === 0) {
                        throw new \DomainException('An APV must have at least one particular before it can be submitted.');
                    }

                    // Sync total_amount from particulars
                    $model->total_amount = $model->particulars()->sum('amount');
                    $model->save();
                },
            ],

            'after' => [
                'approve' => function (\Illuminate\Database\Eloquent\Model $model, string $from, string $to, array $context): void {
                    $model->update([
                        'approved_by' => auth()->id(),
                        'approved_at' => now(),
                    ]);
                },

                'release' => function (\Illuminate\Database\Eloquent\Model $model, string $from, string $to, array $context): void {
                    $model->update([
                        'released_by' => auth()->id(),
                        'released_at' => now(),
                    ]);
                },

                'reject' => function (\Illuminate\Database\Eloquent\Model $model, string $from, string $to, array $context): void {
                    $model->update([
                        'rejected_reason' => $context['rejected_reason'] ?? null,
                    ]);
                },

                'reject_after_approval' => function (\Illuminate\Database\Eloquent\Model $model, string $from, string $to, array $context): void {
                    $model->update([
                        'rejected_reason' => $context['rejected_reason'] ?? null,
                    ]);
                },
            ],
        ],
    ],

    // -------------------------------------------------------------------------
    // Gates — paste inside  'guards' => [...]  in your workflow.php
    // -------------------------------------------------------------------------
    // These are handled via Gate::define() in AuthServiceProvider using
    // Spatie's hasRole() / hasAnyRole().  No static role arrays needed here.
    //
    // 'guards' => [
    //     'workflow.apv.can_submit'  => [],   // encoder  — via Gate::define
    //     'workflow.apv.can_approve' => [],   // manager  — via Gate::define
    //     'workflow.apv.can_release' => [],   // director|finance — via Gate::define
    // ],
];
