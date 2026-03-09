<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('designated_approvers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('approval_type'); // 'approver' or 'releaser'
            $table->string('title')->nullable(); // e.g., "Operations Manager", "Finance Director"
            $table->integer('order')->default(0); // For ordering in PDF
            $table->boolean('is_required')->default(false); // Whether approval is mandatory
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'approval_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('designated_approvers');
    }
};
