<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\AccountPayableVoucherParticular;
use App\Models\AccountabilityPaymentVoucher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AccountPayableVoucherParticular>
 */
class AccountPayableVoucherParticularFactory extends Factory
{
    protected $model = AccountPayableVoucherParticular::class;

    protected array $categories = [
        'Office Supplies',
        'Equipment',
        'Software',
        'Services',
        'Travel',
        'Training',
        'Utilities',
        'Rent',
        'Maintenance',
        'Consulting',
        'Marketing',
        'Other',
    ];

    public function definition(): array
    {
        $quantity = $this->faker->numberBetween(1, 50);
        $unitPrice = $this->faker->randomFloat(2, 100, 50000);
        $amount = $quantity * $unitPrice;

        return [
            'apv_id' => AccountabilityPaymentVoucher::factory(),
            'description' => $this->faker->sentence(4),
            'category' => $this->faker->randomElement($this->categories),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'amount' => $amount,
            'created_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'updated_at' => fn (array $attributes) => $attributes['created_at'],
        ];
    }

    // -------------------------------------------------------------------------
    // Category states
    // -------------------------------------------------------------------------

    public function officeSupplies(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'Office Supplies',
            'description' => $this->faker->randomElement([
                'Printer paper',
                'Pens and markers',
                'Folders and binders',
                'Desk organizer',
                'Stapler and staples',
            ]),
        ]);
    }

    public function equipment(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'Equipment',
            'unit_price' => $this->faker->randomFloat(2, 5000, 50000),
            'quantity' => $this->faker->numberBetween(1, 5),
            'description' => $this->faker->randomElement([
                'Laptop computer',
                'Monitor',
                'Printer',
                'Office chair',
                'Desk',
            ]),
        ]);
    }

    public function software(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'Software',
            'unit_price' => $this->faker->randomFloat(2, 1000, 20000),
            'quantity' => $this->faker->numberBetween(1, 10),
            'description' => $this->faker->randomElement([
                'Microsoft Office license',
                'Adobe Creative Cloud',
                'Antivirus subscription',
                'Project management tool',
                'Accounting software',
            ]),
        ]);
    }

    public function services(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'Services',
            'quantity' => 1,
            'unit_price' => $this->faker->randomFloat(2, 2000, 30000),
            'description' => $this->faker->randomElement([
                'Consulting services',
                'Cleaning services',
                'Security services',
                'Legal consultation',
                'IT support',
            ]),
        ]);
    }

    public function travel(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'Travel',
            'quantity' => $this->faker->numberBetween(1, 5),
            'unit_price' => $this->faker->randomFloat(2, 1000, 15000),
            'description' => $this->faker->randomElement([
                'Flight tickets',
                'Hotel accommodation',
                'Meal allowance',
                'Transportation',
                'Conference registration',
            ]),
        ]);
    }

    // -------------------------------------------------------------------------
    // Quantity states
    // -------------------------------------------------------------------------

    public function singleItem(): static
    {
        return $this->state(fn (array $attributes) => [
            'quantity' => 1,
            'amount' => fn (array $attrs) => $attrs['quantity'] * $attrs['unit_price'],
        ]);
    }

    public function bulkOrder(int $minQuantity = 10): static
    {
        return $this->state(fn (array $attributes) => [
            'quantity' => $this->faker->numberBetween($minQuantity, 100),
            'amount' => fn (array $attrs) => $attrs['quantity'] * $attrs['unit_price'],
        ]);
    }

    // -------------------------------------------------------------------------
    // Price states
    // -------------------------------------------------------------------------

    public function lowValue(): static
    {
        return $this->state(fn (array $attributes) => [
            'unit_price' => $this->faker->randomFloat(2, 50, 500),
            'amount' => fn (array $attrs) => $attrs['quantity'] * $attrs['unit_price'],
        ]);
    }

    public function highValue(float $min = 10000): static
    {
        return $this->state(fn (array $attributes) => [
            'unit_price' => $this->faker->randomFloat(2, $min, 100000),
            'amount' => fn (array $attrs) => $attrs['quantity'] * $attrs['unit_price'],
        ]);
    }

    // -------------------------------------------------------------------------
    // APV relationship
    // -------------------------------------------------------------------------

    public function forApv(AccountabilityPaymentVoucher $apv): static
    {
        return $this->state(fn (array $attributes) => [
            'apv_id' => $apv->id,
        ]);
    }
}
