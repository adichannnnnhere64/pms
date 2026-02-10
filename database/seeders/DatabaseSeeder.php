<?php

namespace Database\Seeders;

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
        ]);
    }
}
