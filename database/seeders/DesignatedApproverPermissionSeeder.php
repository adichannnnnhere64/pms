<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DesignatedApproverPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $group = 'Access';

        $permissions = [
            'designated-approvers-view',
        ];

        $admin = Role::where('name', 'admin')->first();

        foreach ($permissions as $name) {
            $permission = Permission::where('name', $name)->first();

            if (!$permission) {
                $permission = Permission::create([
                    'name' => $name,
                    'group' => $group,
                ]);
            } else {
                $permission->update(['group' => $group]);
            }

            if ($admin && !$admin->hasPermissionTo($permission)) {
                $admin->givePermissionTo($permission);
            }
        }
    }
}
