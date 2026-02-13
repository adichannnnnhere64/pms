<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountPayableVoucherParticular extends Model
{
    use HasFactory;

    protected $table = 'apv_particulars';

    protected $fillable = [
        'apv_id',
        'description',
        'category',
        'quantity',
        'unit_price',
        'amount',
    ];

    protected $casts = [
        'quantity'   => 'integer',
        'unit_price' => 'decimal:2',
        'amount'     => 'decimal:2',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function apv(): BelongsTo
    {
        return $this->belongsTo(AccountabilityPaymentVoucher::class, 'apv_id');
    }

    // -------------------------------------------------------------------------
    // Boot — auto-compute amount
    // -------------------------------------------------------------------------

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (self $model): void {
            $model->amount = (float) $model->quantity * (float) $model->unit_price;
        });
    }
}
