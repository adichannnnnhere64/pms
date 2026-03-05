<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use Spatie\Permission\Models\Permission;

class VesselMenuSeeder extends Seeder
{
    public function run(): void
    {
        // Find the Access group
        $accessGroup = Menu::where('title', 'Access')->first();
        
        if ($accessGroup) {
            Menu::create([
                'title' => 'Vessels',
                'icon' => 'Ship',
                'route' => '/vessels',
                'order' => 6,
                'permission_name' => 'vessels-view',
                'parent_id' => $accessGroup->id,
            ]);
            
            Permission::firstOrCreate(['name' => 'vessels-view']);
            
            // Give permission to admin role if it exists
            $adminRole = \Spatie\Permission\Models\Role::where('name', 'admin')->first();
            if ($adminRole) {
                $adminRole->givePermissionTo('vessels-view');
            }
        }

        // Add initial vessels
        $vessels = [
            ['name' => 'MV Sta. Maria', 'code' => 'SM-001'],
            ['name' => 'MV Sta. Editha', 'code' => 'SE-002'],
            ['name' => 'Starlight Express', 'code' => 'SX-003'],
            ['name' => 'Montenegro', 'code' => 'MT-004'],
        ];

        foreach ($vessels as $vessel) {
            \App\Models\Vessel::firstOrCreate(['name' => $vessel['name']], $vessel);
        }
    }
}
