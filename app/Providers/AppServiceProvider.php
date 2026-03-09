<?php

namespace App\Providers;

use App\Models\DesignatedApprover;
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

        // -- Step 2: Manager OR Designated Approver validates the request -------------
        Gate::define('workflow.apv.can_approve', function ($user): bool {
            // Check if user is a designated approver OR has manager role
            return DesignatedApprover::isDesignatedApprover($user->id)
                || $user->hasRole('manager');
        });

        // -- Step 3: Director/Finance OR Designated Releaser releases payment ---------
        Gate::define('workflow.apv.can_release', function ($user): bool {
            // Check if user is a designated releaser OR has director/finance role
            return DesignatedApprover::isDesignatedReleaser($user->id)
                || $user->hasAnyRole(['director', 'finance']);
        });

        // Generic workflow gates - also check designated approvers
        Gate::define('workflow.can_submit', fn ($user, $model = null) => $user->hasPermissionTo('apv.submit'));

        Gate::define('workflow.can_approve', function ($user, $model = null) {
            return DesignatedApprover::isDesignatedApprover($user->id)
                || $user->hasPermissionTo('apv.approve');
        });

        Gate::define('workflow.can_reject', function ($user, $model = null) {
            return DesignatedApprover::isDesignatedApprover($user->id)
                || DesignatedApprover::isDesignatedReleaser($user->id)
                || $user->hasPermissionTo('apv.reject');
        });

        Gate::define('workflow.can_process_payment', function ($user, $model = null) {
            return DesignatedApprover::isDesignatedReleaser($user->id)
                || $user->hasPermissionTo('apv.release');
        });

    }
}
