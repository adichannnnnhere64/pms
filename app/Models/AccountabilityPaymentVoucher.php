<?php

declare(strict_types=1);

namespace App\Models;

use Adichan\WorkflowEngine\Traits\HasWorkflow;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;

class AccountabilityPaymentVoucher extends Model
{
    use HasFactory, HasRoles, HasWorkflow, SoftDeletes;

    protected $table = 'accountability_payment_vouchers';

    protected $fillable = [
        'reference_number',
        'requested_by',
        'vendor_name',
        'department',
        'total_amount',
        'notes',
        'expected_date',
        'attachments',
        'is_priority',
        'particular',
        'status',
        'rejected_reason',
        'approved_by',
        'approved_at',
        'released_by',
        'released_at',
    ];

    protected $casts = [
        'attachments'   => 'array',
        'total_amount'  => 'decimal:2',
        'expected_date' => 'date',
        'approved_at'   => 'datetime',
        'released_at'   => 'datetime',
    ];

    /**
     * The workflow name registered in config/workflow.php
     */
    public string $workflowName = 'apv';

    protected string $stateColumn = 'status';

    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model): void {
            if (empty($model->reference_number)) {
                $model->reference_number = static::generateReferenceNumber();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function particulars(): HasMany
    {
        return $this->hasMany(AccountPayableVoucherParticular::class, 'apv_id');
    }

    // -------------------------------------------------------------------------
    // Computed / helpers
    // -------------------------------------------------------------------------

    public function getComputedTotalAttribute(): float
    {
        return (float) $this->particulars()->sum('amount');
    }

    public function isEditable(): bool
    {
        return $this->status === 'draft';
    }

    public function isPendingApproval(): bool
    {
        return $this->status === 'pending_approval';
    }

    public function isApproved(): bool
    {
        return in_array($this->status, ['approved', 'completed'], true);
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    // -------------------------------------------------------------------------
    // Static helpers
    // -------------------------------------------------------------------------

    public static function generateReferenceNumber(): string
    {
        $prefix = 'APV-' . now()->format('Ym') . '-';
        $latest = static::withTrashed()
            ->where('reference_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('reference_number');

        $sequence = $latest
            ? (int) substr($latest, strrpos($latest, '-') + 1) + 1
            : 1;

        return $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
