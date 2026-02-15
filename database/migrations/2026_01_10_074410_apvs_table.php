<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accountability_payment_vouchers', function (Blueprint $table) {
            $table->boolean('is_priority')->default(false);
            $table->string('particular')->nullable();
        });
    }

    public function down(): void
    {
        /* Schema::dropIfExists('apv_particulars'); */
    }
};
