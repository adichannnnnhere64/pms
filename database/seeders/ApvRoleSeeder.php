<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ApvRoleSeeder extends Seeder
{
    /**
     * Roles and their APV permissions.
     *
     * Run with:  php artisan db:seed --class=ApvRoleSeeder
     */
    public function run(): void
    {
        // Reset cached roles & permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // -----------------------------------------------------------------------
        // Permissions
        // -----------------------------------------------------------------------
        $permissions = [
            'apv.create',   // fill in the form
            'apv.submit',   // submit for review          (encoder)
            'apv.approve',  // validate / sign off        (manager)
            'apv.reject',   // reject at any stage
            'apv.release',  // release payment            (director | finance)
            'apv.view',     // read-only access
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // -----------------------------------------------------------------------
        // Roles
        // -----------------------------------------------------------------------

        // Encoder — fills in and submits the APV
        $encoder = Role::firstOrCreate(['name' => 'encoder', 'guard_name' => 'web']);
        $encoder->syncPermissions(['apv.create', 'apv.submit', 'apv.view', 'workflows.view', 'dashboard-view']);

        // Manager — validates the submitted APV (step 2)
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $manager->syncPermissions(['apv.approve', 'apv.reject', 'apv.view', 'workflows.view', 'dashboard-view']);

        // Director — can release or reject after approval (step 3)
        $director = Role::firstOrCreate(['name' => 'director', 'guard_name' => 'web']);
        $director->syncPermissions(['apv.release', 'apv.reject', 'apv.view', 'dashboard-view', 'workflows.view']);

        // Finance — can also release or reject after approval (step 3)
        $finance = Role::firstOrCreate(['name' => 'finance', 'guard_name' => 'web']);
        $finance->syncPermissions(['apv.release', 'apv.reject', 'apv.view', 'dashboard-view', 'workflows.view']);

        $this->command->info('APV roles and permissions seeded.');
    }
}
