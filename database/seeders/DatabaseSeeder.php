<?php

namespace Database\Seeders;


        use App\Models\AccountabilityPaymentVoucher;
use Database\Factories\AccountabilityPaymentVoucherFactory;
use Database\Factories\AccountPayableVoucherParticularFactory;


use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    // DatabaseSeeder.php
public function run(): void
{



    // First seed ALL roles and permissions
    $this->call([
        RolePermissionSeeder::class,
        ApvRoleSeeder::class,  // Move this BEFORE creating users
        MenuSeeder::class,
    ]);

    // Then create users
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

    // ... rest of your APV creation code ...

    // Create manager LAST (or better, use one of the existing approvers)
    $manager = User::factory()->create([
        'name' => 'Manager',
        'email' => 'manager@yahoo.com',
        'password' => Hash::make('manager'),
    ]);
    $manager->assignRole('manager');

    $supervisor = User::factory()->create([
        'name' => 'Supervisor',
        'email' => 'supervisor@yahoo.com',
        'password' => Hash::make('supervisor'),
    ]);
    $supervisor->assignRole('director');
}

}
