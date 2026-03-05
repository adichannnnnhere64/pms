<?php

use Adichan\WorkflowEngine\States\StateMachine;
use App\Models\AccountabilityPaymentVoucher;
use App\Models\AccountPayableVoucherParticular;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------



beforeEach(function (): void {
    // Create Spatie roles
    Role::firstOrCreate(['name' => 'encoder',  'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'manager',  'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'director', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'finance',  'guard_name' => 'web']);

    // Users — assign Spatie roles
    $this->encoder   = User::factory()->create()->assignRole('encoder');
    $this->manager   = User::factory()->create()->assignRole('manager');
    $this->director  = User::factory()->create()->assignRole('director');
    $this->finance   = User::factory()->create()->assignRole('finance');

    // Gates using Spatie hasRole() / hasAnyRole()
    Gate::define('workflow.can_submit',  fn ($u) => $u->hasRole('encoder'));
    Gate::define('workflow.can_approve', fn ($u) => $u->hasRole('manager'));
    Gate::define('workflow.can_process_payment', fn ($u) => $u->hasAnyRole(['director', 'finance']));

    // Workflow definition — mirrors config/apv_workflow.php
    $this->apvWorkflowConfig = [
        'state_column' => 'status',
        'states' => [
            ['value' => 'draft',            'label' => 'Draft',            'is_initial' => true],
            ['value' => 'pending_approval', 'label' => 'Pending Approval'],
            ['value' => 'approved',         'label' => 'Approved'],
            ['value' => 'rejected',         'label' => 'Rejected',  'is_final' => true],
            ['value' => 'completed',        'label' => 'Completed', 'is_final' => true],
        ],
        'transitions' => [
            [
                'name'      => 'submit',
                'from'      => 'draft',
                'to'        => 'pending_approval',
                'guard'     => 'workflow.can_submit',
                'validator' => fn (array $ctx) => ! empty($ctx['attachments']),
            ],
            [
                'name'  => 'approve',
                'from'  => 'pending_approval',
                'to'    => 'approved',
                'guard' => 'workflow.can_approve',
            ],
            [
                'name'      => 'reject',
                'from'      => 'pending_approval',
                'to'        => 'rejected',
                'guard'     => 'workflow.can_approve',
                'validator' => fn (array $ctx) => ! empty($ctx['rejected_reason']),
            ],
            [
                'name'  => 'release',
                'from'  => 'approved',
                'to'    => 'completed',
                'guard' => 'workflow.can_process_payment',
            ],
            [
                'name'      => 'reject_after_approval',
                'from'      => 'approved',
                'to'        => 'rejected',
                'guard'     => 'workflow.can_process_payment',
                'validator' => fn (array $ctx) => ! empty($ctx['rejected_reason']),
            ],
        ],
        'hooks' => [
            'after' => [
                'approve' => function ($model) {
                    $model->update(['approved_by' => auth()->id(), 'approved_at' => now()]);
                },
                'release' => function ($model) {
                    $model->update(['released_by' => auth()->id(), 'released_at' => now()]);
                },
                'reject' => function ($model, $from, $to, $ctx) {
                    $model->update(['rejected_reason' => $ctx['rejected_reason'] ?? null]);
                },
                'reject_after_approval' => function ($model, $from, $to, $ctx) {
                    $model->update(['rejected_reason' => $ctx['rejected_reason'] ?? null]);
                },
            ],
        ],
    ];

    // FIX: Set the workflows config with an 'apv' key
    config()->set('workflow.workflows', [
        'apv' => $this->apvWorkflowConfig
    ]);
});



// ---------------------------------------------------------------------------
// Helper — creates an APV with one particular line-item
// ---------------------------------------------------------------------------
function makeApv(User $encoder, array $overrides = []): AccountabilityPaymentVoucher
{
    $apv = AccountabilityPaymentVoucher::factory()->create(array_merge([
        'requested_by' => $encoder->id,
        'status'       => 'draft',
        'vendor_name'  => 'Acme Supplies',
        'notes'        => 'Monthly office replenishment',
        'expected_date'=> now()->addDays(7),
    ], $overrides));

    AccountPayableVoucherParticular::factory()->create([
        'apv_id'      => $apv->id,
        'description' => 'Office chair',
        'category'    => 'furniture',
        'quantity'    => 2,
        'unit_price'  => 5000.00,
        'amount'      => 10000.00,
    ]);

    return $apv;
}

// ===========================================================================
// ROLE GUARD TESTS
// ===========================================================================

test('encoder role can submit', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'submit', ['attachments' => ['file.pdf']]))->toBeTrue();
});

test('manager role can approve', function (): void {
    $this->actingAs($this->manager);
    $apv = makeApv($this->encoder, ['status' => 'pending_approval']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'approve'))->toBeTrue();
});

test('director role can release', function (): void {
    $this->actingAs($this->director);
    $apv = makeApv($this->encoder, ['status' => 'approved']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'release'))->toBeTrue();
});

test('finance role can release', function (): void {
    $this->actingAs($this->finance);
    $apv = makeApv($this->encoder, ['status' => 'approved']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'release'))->toBeTrue();
});

test('encoder cannot approve — wrong role', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder, ['status' => 'pending_approval']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'approve'))->toBeFalse();
});

test('manager cannot release — wrong role', function (): void {
    $this->actingAs($this->manager);
    $apv = makeApv($this->encoder, ['status' => 'approved']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'release'))->toBeFalse();
});

test('encoder cannot release — wrong role', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder, ['status' => 'approved']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'release'))->toBeFalse();
});

test('director cannot approve at step 2 — wrong role', function (): void {
    $this->actingAs($this->director);
    $apv = makeApv($this->encoder, ['status' => 'pending_approval']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'approve'))->toBeFalse();
});

test('finance cannot approve at step 2 — wrong role', function (): void {
    $this->actingAs($this->finance);
    $apv = makeApv($this->encoder, ['status' => 'pending_approval']);

    $sm = new StateMachine('apv', $this->apvWorkflowConfig);
    expect($sm->can($apv, 'approve'))->toBeFalse();
});

// ===========================================================================
// HAPPY PATH — full 3-step flow via director
// ===========================================================================

test('complete APV flow: encoder submits → manager approves → director releases', function (): void {
    // Step 1 — Encoder submits
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);

    $t1 = $apv->transition('submit', [
        'attachments' => ['receipt.pdf', 'quote.pdf'],
    ]);

    expect($apv->refresh()->status)->toBe('pending_approval')
        ->and($t1->getFromState())->toBe('draft')
        ->and($t1->getToState())->toBe('pending_approval');

    // Step 2 — Manager approves
    $this->actingAs($this->manager);
    $apv->refresh();

    $t2 = $apv->transition('approve');

    $apv->refresh();
    expect($apv->status)->toBe('approved')
        ->and($apv->approved_by)->toBe($this->manager->id)
        ->and($apv->approved_at)->not->toBeNull();

    // Step 3 — Director releases
    $this->actingAs($this->director);
    $apv->refresh();

    $t3 = $apv->transition('release');

    $apv->refresh();
    expect($apv->status)->toBe('completed')
        ->and($apv->released_by)->toBe($this->director->id)
        ->and($apv->released_at)->not->toBeNull();

    // Full history
    $history = $apv->transitionHistory();
    expect($history)->toHaveCount(3)
        ->and($history[0]['transition'])->toBe('submit')
        ->and($history[1]['transition'])->toBe('approve')
        ->and($history[2]['transition'])->toBe('release');
});

// ===========================================================================
// HAPPY PATH — full 3-step flow via finance
// ===========================================================================

test('complete APV flow: encoder submits → manager approves → finance releases', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['invoice.pdf']]);

    $this->actingAs($this->manager);
    $apv->refresh();
    $apv->transition('approve');

    $this->actingAs($this->finance);
    $apv->refresh();
    $apv->transition('release');

    $apv->refresh();
    expect($apv->status)->toBe('completed')
        ->and($apv->released_by)->toBe($this->finance->id);
});

// ===========================================================================
// REJECTION PATHS
// ===========================================================================

test('manager can reject at step 2 with a reason', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['file.pdf']]);

    $this->actingAs($this->manager);
    $apv->refresh();
    $apv->transition('reject', ['rejected_reason' => 'Receipts are missing vendor details.']);

    $apv->refresh();
    expect($apv->status)->toBe('rejected')
        ->and($apv->rejected_reason)->toBe('Receipts are missing vendor details.');
});

test('rejection at step 2 requires a reason', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['file.pdf']]);

    $this->actingAs($this->manager);
    $apv->refresh();

    expect(fn () => $apv->transition('reject', []))
        ->toThrow(\DomainException::class);

    expect($apv->refresh()->status)->toBe('pending_approval');
});

test('director can reject an already-approved APV', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['file.pdf']]);

    $this->actingAs($this->manager);
    $apv->refresh();
    $apv->transition('approve');

    $this->actingAs($this->director);
    $apv->refresh();
    $apv->transition('reject_after_approval', [
        'rejected_reason' => 'Budget frozen for this quarter.',
    ]);

    $apv->refresh();
    expect($apv->status)->toBe('rejected')
        ->and($apv->rejected_reason)->toBe('Budget frozen for this quarter.');
});

test('finance can reject an already-approved APV', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['file.pdf']]);

    $this->actingAs($this->manager);
    $apv->refresh();
    $apv->transition('approve');

    $this->actingAs($this->finance);
    $apv->refresh();
    $apv->transition('reject_after_approval', [
        'rejected_reason' => 'Duplicate payment detected.',
    ]);

    $apv->refresh();
    expect($apv->status)->toBe('rejected')
        ->and($apv->rejected_reason)->toBe('Duplicate payment detected.');
});

// ===========================================================================
// ILLEGAL TRANSITION TESTS
// ===========================================================================

test('cannot submit without attachments', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);

    expect(fn () => $apv->transition('submit', ['attachments' => []]))
        ->toThrow(\DomainException::class);

    expect($apv->refresh()->status)->toBe('draft');
});

test('cannot skip states — draft cannot jump to approved', function (): void {
    $this->actingAs($this->manager);
    $apv = makeApv($this->encoder);

    expect(fn () => $apv->transition('approve'))
        ->toThrow(\DomainException::class);

    expect($apv->refresh()->status)->toBe('draft');
});

test('cannot release from pending_approval — must approve first', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['file.pdf']]);

    $this->actingAs($this->director);
    $apv->refresh();

    expect(fn () => $apv->transition('release'))
        ->toThrow(\DomainException::class);

    expect($apv->refresh()->status)->toBe('pending_approval');
});

test('completed APV has no available transitions', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['file.pdf']]);

    $this->actingAs($this->manager);
    $apv->refresh();
    $apv->transition('approve');

    $this->actingAs($this->finance);
    $apv->refresh();
    $apv->transition('release');

    $apv->refresh();
    expect($apv->availableTransitions())->toBeEmpty();
});

// ===========================================================================
// HISTORY & AUDIT
// ===========================================================================

test('transition history records the correct role holder at each step', function (): void {
    $this->actingAs($this->encoder);
    $apv = makeApv($this->encoder);
    $apv->transition('submit', ['attachments' => ['file.pdf']]);

    $this->actingAs($this->manager);
    $apv->refresh();
    $apv->transition('approve');

    $this->actingAs($this->finance);
    $apv->refresh();
    $apv->transition('release');

    $history = $apv->transitionHistory();

    expect($history[0]['performed_by'])->toBe($this->encoder->id)
        ->and($history[1]['performed_by'])->toBe($this->manager->id)
        ->and($history[2]['performed_by'])->toBe($this->finance->id);
});

// ===========================================================================
// REFERENCE NUMBER
// ===========================================================================

test('APV reference number is auto-generated on creation', function (): void {
    $apv = makeApv($this->encoder);
    expect($apv->reference_number)->toMatch('/^RAF-\d{6}-\d{4}$/');
});

test('each APV gets a unique sequential reference number', function (): void {
    $apv1 = makeApv($this->encoder);
    $apv2 = makeApv($this->encoder);
    expect($apv1->reference_number)->not->toBe($apv2->reference_number);
});

// ===========================================================================
// PARTICULARS
// ===========================================================================

test('APV computed total matches sum of line-items', function (): void {
    $apv = makeApv($this->encoder); // 1 chair × 2 = 10 000

    AccountPayableVoucherParticular::factory()->create([
        'apv_id'      => $apv->id,
        'description' => 'Office desk',
        'quantity'    => 1,
        'unit_price'  => 8000.00,
        'amount'      => 8000.00,
    ]);

    expect($apv->computed_total)->toBe(18000.0);
});

test('particular amount auto-computes from quantity × unit_price', function (): void {
    $particular = AccountPayableVoucherParticular::factory()->create([
        'apv_id'      => makeApv($this->encoder)->id,
        'description' => 'Printer paper',
        'quantity'    => 5,
        'unit_price'  => 350.00,
        'amount'      => 0,
    ]);

    expect((float) $particular->fresh()->amount)->toBe(1750.0);
});
