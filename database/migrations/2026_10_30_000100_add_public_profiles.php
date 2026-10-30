<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('public_id', 12)->nullable()->unique()->after('id');
            $table->boolean('profile_public')->default(false)->after('is_admin');
        });

        foreach (DB::table('users')->whereNull('public_id')->pluck('id') as $id) {
            DB::table('users')->where('id', $id)->update(['public_id' => Str::lower(Str::random(10))]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['public_id', 'profile_public']);
        });
    }
};
