<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AccountabilityPaymentVoucher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RafApprovedSeeder extends Seeder
{
    public function run(): void
    {
        $encoder = User::role('encoder')->first();
        if (! $encoder) {
            $encoder = User::factory()->create([
                'name' => 'Encoder Test',
                'email' => 'encoder.test@example.com',
                'password' => Hash::make('encoder'),
            ]);
            $encoder->assignRole('encoder');
        }

        $manager = User::role('manager')->first();
        if (! $manager) {
            $manager = User::factory()->create([
                'name' => 'Manager Test',
                'email' => 'manager.test@example.com',
                'password' => Hash::make('manager'),
            ]);
            $manager->assignRole('manager');
        }

        $approvedAt = now()->subDay();
        $submittedAt = now()->subDays(2);

        $apv = AccountabilityPaymentVoucher::factory()
            ->state([
                'status' => 'approved',
                'approved_by' => $manager->id,
                'approved_at' => $approvedAt,
                'released_by' => null,
                'released_at' => null,
                'rejected_reason' => null,
            ])
            ->requestedBy($encoder)
            ->withParticulars(3)
            ->withCalculatedTotal()
            ->create([
                'reference_number' => 'RAF-TEST-APPROVED-' . now()->format('His'),
            ]);

        DB::table('workflow_transitions')->insert([
            [
                'workflow_type' => 'apv',
                'model_type' => AccountabilityPaymentVoucher::class,
                'model_id' => $apv->id,
                'transition' => 'submit',
                'from_state' => 'draft',
                'to_state' => 'pending_approval',
                'context' => json_encode([]),
                'performed_by' => $encoder->id,
                'performed_at' => $submittedAt,
                'metadata' => json_encode([]),
                'created_at' => $submittedAt,
                'updated_at' => $submittedAt,
            ],
            [
                'workflow_type' => 'apv',
                'model_type' => AccountabilityPaymentVoucher::class,
                'model_id' => $apv->id,
                'transition' => 'approve',
                'from_state' => 'pending_approval',
                'to_state' => 'approved',
                'context' => json_encode(['comment' => 'Approved for release testing.']),
                'performed_by' => $manager->id,
                'performed_at' => $approvedAt,
                'metadata' => json_encode([]),
                'created_at' => $approvedAt,
                'updated_at' => $approvedAt,
            ],
        ]);
    }
}
