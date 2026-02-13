<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // -----------------------------------------------------------------------
        // Main APV table
        // -----------------------------------------------------------------------
        Schema::create('accountability_payment_vouchers', function (Blueprint $table): void {
            $table->id();

            // Unique human-readable reference, e.g. APV-202501-0001
            $table->string('reference_number', 30)->unique();

            // Who created the request
            $table->foreignId('requested_by')
                  ->constrained('users')
                  ->onDelete('restrict');

            // Vendor / supplier
            $table->string('vendor_name', 200);

            // Department or cost center
            $table->string('department', 100)->nullable();

            // Monetary total (can also be recomputed from particulars)
            $table->decimal('total_amount', 12, 2)->default(0);

            // Free-text justification / notes
            $table->text('notes')->nullable();

            // When the goods/services are needed
            $table->date('expected_date')->nullable();

            // Supporting files – stored as an array of paths/URLs
            $table->json('attachments')->nullable();

            // -----------------------------------------------------------------------
            // Workflow state column
            // -----------------------------------------------------------------------
            $table->string('status', 50)->default('draft')->index();

            // Reason filled in when the APV is rejected
            $table->text('rejected_reason')->nullable();

            // -----------------------------------------------------------------------
            // Approval audit trail (denormalised for quick reads)
            // -----------------------------------------------------------------------
            $table->foreignId('approved_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->timestamp('approved_at')->nullable();

            $table->foreignId('released_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->timestamp('released_at')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'requested_by']);
            $table->index('expected_date');
        });

        // -----------------------------------------------------------------------
        // Line-items / particulars
        // -----------------------------------------------------------------------
        Schema::create('apv_particulars', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('apv_id')
                  ->constrained('accountability_payment_vouchers')
                  ->onDelete('cascade');

            // e.g. "Office chair x2", "Team lunch"
            $table->string('description', 300);

            // Optional grouping: food, furniture, transport, etc.
            $table->string('category', 100)->nullable();

            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('amount', 12, 2);     // quantity × unit_price (computed on save)

            $table->timestamps();

            $table->index('apv_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apv_particulars');
        Schema::dropIfExists('accountability_payment_vouchers');
    }
};
