<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Free entry by email: the site issues a personal code, the player emails it to us with their details,
 * and we approve once the email arrives. The written request now lives in that email.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('free_entry_requests', function (Blueprint $table) {
            $table->text('statement')->nullable()->change();
            $table->timestamp('email_received_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('free_entry_requests', function (Blueprint $table) {
            $table->dropColumn('email_received_at');
        });
    }
};
