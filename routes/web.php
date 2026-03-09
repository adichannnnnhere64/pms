<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignatedApproverController;
use App\Http\Controllers\MediaFolderController;
use App\Http\Controllers\VesselController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingAppController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserFileController;
use App\Http\Controllers\WorkflowController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'menu.permission'])->group(function () {

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('roles', RoleController::class);
    Route::resource('menus', MenuController::class);
    Route::post('menus/reorder', [MenuController::class, 'reorder'])->name('menus.reorder');
    Route::resource('permissions', PermissionController::class);
    Route::resource('departments', DepartmentController::class);
    Route::resource('users', UserController::class);
    Route::resource('vessels', VesselController::class);
    Route::put('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('/settingsapp', [SettingAppController::class, 'edit'])->name('setting.edit');
    Route::post('/settingsapp', [SettingAppController::class, 'update'])->name('setting.update');

    // Designated Approvers Management
    Route::get('/designated-approvers', [DesignatedApproverController::class, 'index'])->name('designated-approvers.index');
    Route::post('/designated-approvers', [DesignatedApproverController::class, 'store'])->name('designated-approvers.store');
    Route::put('/designated-approvers/{designatedApprover}', [DesignatedApproverController::class, 'update'])->name('designated-approvers.update');
    Route::delete('/designated-approvers/{designatedApprover}', [DesignatedApproverController::class, 'destroy'])->name('designated-approvers.destroy');
    Route::post('/designated-approvers/reorder', [DesignatedApproverController::class, 'reorder'])->name('designated-approvers.reorder');
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
    Route::get('/backup', [BackupController::class, 'index'])->name('backup.index');
    Route::post('/backup/run', [BackupController::class, 'run'])->name('backup.run');
    Route::get('/backup/download/{file}', [BackupController::class, 'download'])->name('backup.download');
    Route::delete('/backup/delete/{file}', [BackupController::class, 'delete'])->name('backup.delete');
    Route::get('/files', [UserFileController::class, 'index'])->name('files.index');
    Route::post('/files', [UserFileController::class, 'store'])->name('files.store');
    Route::delete('/files/{id}', [UserFileController::class, 'destroy'])->name('files.destroy');
    Route::resource('media', MediaFolderController::class);

    /* Route::get('/workflows/apv', [WorkflowController::class, 'index'])->name('workflow.index'); */

    Route::get('/workflow', [WorkflowController::class, 'index'])->name('workflow.index');
    Route::get('/workflow/create', [WorkflowController::class, 'create'])->name('workflow.create');
    Route::post('/workflow', [WorkflowController::class, 'store'])->name('workflow.store');
    Route::get('/workflow/{apv}/edit', [WorkflowController::class, 'edit'])->name('workflow.edit');
    Route::put('/workflow/{apv}', [WorkflowController::class, 'update'])->name('workflow.update');
    Route::get('/workflow/{apv}', [WorkflowController::class, 'show'])->name('workflow.show');
    Route::post('/workflow/{apv}/transition', [WorkflowController::class, 'transition'])->name('workflow.transition');
    Route::get('/workflow/{apv}/pdf', [WorkflowController::class, 'downloadPdf'])->name('workflow.pdf');

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
