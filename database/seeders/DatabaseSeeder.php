<?php

namespace Database\Seeders;


        use App\Models\AccountabilityPaymentVoucher;
use Database\Factories\AccountabilityPaymentVoucherFactory;
use Database\Factories\AccountPayableVoucherParticularFactory;


use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
        ]);

        $user = User::factory()->create([
            'name' => 'Admin',
            'email' => 'carlo@yahoo.com',
            'password' => Hash::make('carlo'),
        ]);

        $user->assignRole('admin');


        $user = User::factory()->create([
            'name' => 'Admin',
            'email' => 'mobistyle35@gmail.com',
            'password' => Hash::make('adrianradores'),
        ]);

        $user->assignRole('admin');

        $this->call([
            MenuSeeder::class,
            ApvRoleSeeder::class,
        ]);


        $user = User::factory()->create([
            'name' => 'Encoder',
            'email' => 'encoder@yahoo.com',
            'password' => Hash::make('encoder'),
        ]);

        $user->assignRole('encoder');

            // Create users with different roles
        $employees = User::factory()->count(10)->create();
        $approvers = User::factory()->count(5)->create();
        $releasers = User::factory()->count(3)->create();

        // Create draft APVs for each employee
        foreach ($employees->take(5) as $employee) {
            AccountabilityPaymentVoucher::factory()
                ->draft()
                ->requestedBy($employee)
                ->withParticulars(3)
                ->withCalculatedTotal()
                ->create();
        }

        // Create pending approvals
        foreach ($employees->take(3) as $employee) {
            AccountabilityPaymentVoucher::factory()
                ->pendingApproval()
                ->requestedBy($employee)
                ->withParticulars(4)
                ->withCalculatedTotal()
                ->create();
        }

        // Create approved ones with custom office supplies
        foreach ($employees->take(3) as $employee) {
            AccountabilityPaymentVoucher::factory()
                ->approved()
                ->requestedBy($employee)
                ->approvedBy($approvers->random())
                ->withParticularsFactory(
                    AccountPayableVoucherParticularFactory::new()->officeSupplies(),
                    2
                )
                ->withParticulars(1) // Add one random particular
                ->withCalculatedTotal()
                ->create();
        }

        // Create completed ones with mixed particulars
        foreach ($employees->take(3) as $employee) {
            AccountabilityPaymentVoucher::factory()
                ->completed()
                ->requestedBy($employee)
                ->approvedBy($approvers->random())
                ->releasedBy($releasers->random())
                ->withParticularsSequence([
                    AccountPayableVoucherParticularFactory::new()->officeSupplies()->count(2),
                    AccountPayableVoucherParticularFactory::new()->services()->count(1),
                    AccountPayableVoucherParticularFactory::new()->equipment()->count(1),
                ])
                ->withCalculatedTotal()
                ->create();
        }

        // Create rejected ones
        foreach ($employees->take(2) as $employee) {
            AccountabilityPaymentVoucher::factory()
                ->rejected()
                ->requestedBy($employee)
                ->approvedBy($approvers->random())
                ->withParticularsFactory(
                    AccountPayableVoucherParticularFactory::new()->lowValue(),
                    2
                )
                ->withCalculatedTotal()
                ->create();
        }

        // Create some high-value APVs
        foreach ($employees->take(2) as $employee) {
            AccountabilityPaymentVoucher::factory()
                ->pendingApproval()
                ->requestedBy($employee)
                ->withAmount(75000.00)
                ->withParticularsFactory(
                    AccountPayableVoucherParticularFactory::new()->highValue(20000),
                    3
                )
                ->withCalculatedTotal()
                ->create();
        }




    }
}
