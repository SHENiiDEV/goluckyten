<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Free entry is by post, not email: the player writes a letter with their code and posts it to
 * config('company.free_entry_address'). Renames the email column and status to match.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('free_entry_requests', 'email_received_at')) {
            Schema::table('free_entry_requests', fn (Blueprint $t) => $t->renameColumn('email_received_at', 'letter_received_at'));
        }
        DB::table('free_entry_requests')->where('status', 'awaiting_email')->update(['status' => 'awaiting_letter']);
    }

    public function down(): void
    {
        DB::table('free_entry_requests')->where('status', 'awaiting_letter')->update(['status' => 'awaiting_email']);
        if (Schema::hasColumn('free_entry_requests', 'letter_received_at')) {
            Schema::table('free_entry_requests', fn (Blueprint $t) => $t->renameColumn('letter_received_at', 'email_received_at'));
        }
    }
};
