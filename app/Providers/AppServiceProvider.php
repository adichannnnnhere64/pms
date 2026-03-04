<?php

namespace App\Providers;

use App\Models\Menu;
use App\Models\SettingApp;
use App\Models\User;
use App\Observers\GlobalActivityLogger;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        User::observe(GlobalActivityLogger::class);
        Role::observe(GlobalActivityLogger::class);
        Permission::observe(GlobalActivityLogger::class);
        Menu::observe(GlobalActivityLogger::class);
        SettingApp::observe(GlobalActivityLogger::class);

        // -- Step 1: Encoder creates and submits the APV form -------------------------
        Gate::define('workflow.apv.can_submit', function ($user): bool {
            return $user->hasRole('encoder');
        });

        // -- Step 2: Manager validates the request ------------------------------------
        Gate::define('workflow.apv.can_approve', function ($user): bool {
            return $user->hasRole('manager');
        });

        // -- Step 3: Director OR Finance releases the payment -------------------------
        Gate::define('workflow.apv.can_release', function ($user): bool {
            return $user->hasAnyRole(['director', 'finance']);
        });


        Gate::define('workflow.can_submit', fn ($user, $model = null) => $user->hasPermissionTo('apv.submit'));
        Gate::define('workflow.can_approve', fn ($user, $model = null) => $user->hasPermissionTo('apv.approve'));
        Gate::define('workflow.can_reject', fn ($user, $model = null) => $user->hasPermissionTo('apv.reject'));
        Gate::define('workflow.can_process_payment', fn ($user, $model = null) => $user->hasPermissionTo('apv.release'));

    }
}
