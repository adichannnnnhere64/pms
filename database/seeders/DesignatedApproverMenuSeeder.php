<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class DesignatedApproverMenuSeeder extends Seeder
{
    public function run(): void
    {
        $accessGroup = Menu::where('title', 'Access')->first();

        if ($accessGroup) {
            Menu::firstOrCreate(
                [
                    'route' => '/designated-approvers',
                    'parent_id' => $accessGroup->id,
                ],
                [
                    'title' => 'Designated Approvers',
                    'icon' => 'UserCheck',
                    'order' => 7,
                    'permission_name' => 'designated-approvers-view',
                ]
            );

            Permission::firstOrCreate(['name' => 'designated-approvers-view']);

            $adminRole = \Spatie\Permission\Models\Role::where('name', 'admin')->first();
            if ($adminRole) {
                $adminRole->givePermissionTo('designated-approvers-view');
            }
        }
    }
}
