<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\AccountabilityPaymentVoucher;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AccountabilityPaymentVoucher>
 */
class AccountabilityPaymentVoucherFactory extends Factory
{
    protected $model = AccountabilityPaymentVoucher::class;

    public function definition(): array
    {
        $status = $this->faker->randomElement([
            'draft',
            'pending_approval',
            'approved',
            'rejected',
            'completed',
        ]);

        $approvedBy = null;
        $approvedAt = null;
        $releasedBy = null;
        $releasedAt = null;
        $rejectedReason = null;

        if (in_array($status, ['approved', 'completed'])) {
            $approvedBy = User::factory();
            $approvedAt = $this->faker->dateTimeBetween('-30 days', '-1 days');
        }

        if ($status === 'rejected') {
            $rejectedReason = $this->faker->sentence();
        }

        if ($status === 'completed') {
            $releasedBy = User::factory();
            $releasedAt = $this->faker->dateTimeBetween('-5 days', 'now');
        }

        return [
            'reference_number' => $this->faker->unique()->regexify('RAF-[0-9]{6}-[0-9]{4}'),
            'requested_by' => User::factory(),
            'vendor_name' => $this->faker->company(),
            'department' => $this->faker->randomElement([
                'IT',
                'Finance',
                'HR',
                'Operations',
                'Marketing',
                'Sales',
                'Admin',
            ]),
            'total_amount' => $this->faker->randomFloat(2, 1000, 100000),
            'notes' => $this->faker->optional(0.7)->paragraph(),
            'expected_date' => $this->faker->dateTimeBetween('now', '+60 days'),
            'attachments' => $this->faker->optional(0.5)->passthrough([
                [
                    'name' => $this->faker->word() . '.pdf',
                    'path' => 'apv-attachments/' . $this->faker->uuid() . '.pdf',
                    'size' => $this->faker->numberBetween(100000, 5000000),
                    'type' => 'application/pdf',
                ],
            ]),
            'status' => $status,
            'rejected_reason' => $rejectedReason,
            'approved_by' => $approvedBy,
            'approved_at' => $approvedAt,
            'released_by' => $releasedBy,
            'released_at' => $releasedAt,
            'created_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'updated_at' => fn (array $attributes) => $attributes['created_at'],
        ];
    }

    // -------------------------------------------------------------------------
    // States
    // -------------------------------------------------------------------------

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'approved_by' => null,
            'approved_at' => null,
            'released_by' => null,
            'released_at' => null,
            'rejected_reason' => null,
        ]);
    }

    public function pendingApproval(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending_approval',
            'approved_by' => null,
            'approved_at' => null,
            'released_by' => null,
            'released_at' => null,
            'rejected_reason' => null,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_by' => User::factory(),
            'approved_at' => $this->faker->dateTimeBetween('-14 days', '-1 days'),
            'released_by' => null,
            'released_at' => null,
            'rejected_reason' => null,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejected_reason' => $this->faker->sentence(8),
            'approved_by' => User::factory(),
            'approved_at' => $this->faker->dateTimeBetween('-14 days', '-1 days'),
            'released_by' => null,
            'released_at' => null,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'approved_by' => User::factory(),
            'approved_at' => $this->faker->dateTimeBetween('-30 days', '-15 days'),
            'released_by' => User::factory(),
            'released_at' => $this->faker->dateTimeBetween('-14 days', 'now'),
            'rejected_reason' => null,
        ]);
    }

    // -------------------------------------------------------------------------
    // Configuration states
    // -------------------------------------------------------------------------

    public function withAmount(float $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'total_amount' => $amount,
        ]);
    }

    public function withVendor(string $vendor): static
    {
        return $this->state(fn (array $attributes) => [
            'vendor_name' => $vendor,
        ]);
    }

    public function withDepartment(string $department): static
    {
        return $this->state(fn (array $attributes) => [
            'department' => $department,
        ]);
    }

    public function requestedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'requested_by' => $user->id,
        ]);
    }

    public function approvedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'approved_by' => $user->id,
            'approved_at' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    public function releasedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'released_by' => $user->id,
            'released_at' => $this->faker->dateTimeBetween('-2 days', 'now'),
        ]);
    }

    public function expectedToday(): static
    {
        return $this->state(fn (array $attributes) => [
            'expected_date' => now(),
        ]);
    }

    public function expectedInDays(int $days): static
    {
        return $this->state(fn (array $attributes) => [
            'expected_date' => now()->addDays($days),
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'expected_date' => now()->subDays($this->faker->numberBetween(1, 30)),
            'status' => 'pending_approval',
        ]);
    }

    // -------------------------------------------------------------------------
    // With relationships - FIXED VERSIONS
    // -------------------------------------------------------------------------

    /**
     * Add a specific number of particulars
     */
    public function withParticulars(int $count = 3): static
    {
        return $this->has(
            AccountPayableVoucherParticularFactory::new()->count($count),
            'particulars'
        );
    }

    /**
     * Add custom configured particulars
     */
    public function withParticularsFactory(AccountPayableVoucherParticularFactory $factory, int $count = 1): static
    {
        return $this->has(
            $factory->count($count),
            'particulars'
        );
    }

    /**
     * Add multiple sets of different particular types
     */
    public function withParticularsSequence(array $factories): static
    {
        foreach ($factories as $factory) {
            if ($factory instanceof AccountPayableVoucherParticularFactory) {
                $this->has($factory, 'particulars');
            }
        }

        return $this;
    }

    public function withEmptyParticulars(): static
    {
        return $this->has(
            AccountPayableVoucherParticularFactory::new()->count(0),
            'particulars'
        );
    }

    public function withCalculatedTotal(): static
    {
        return $this->afterCreating(function (AccountabilityPaymentVoucher $apv) {
            $total = $apv->particulars()->sum('amount');
            $apv->update(['total_amount' => $total ?: $apv->total_amount]);
        });
    }
}
