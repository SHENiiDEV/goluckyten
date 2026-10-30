<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('raffles', function (Blueprint $table) {
            $table->string('promo_label', 40)->nullable()->after('subtitle');
            $table->string('headline', 120)->nullable()->after('promo_label');
            $table->string('winner_photo_path')->nullable()->after('winner_ticket_id');
            $table->text('winner_story')->nullable()->after('winner_photo_path');
        });

        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
        Schema::table('raffles', function (Blueprint $table) {
            $table->dropColumn(['promo_label', 'headline', 'winner_photo_path', 'winner_story']);
        });
    }
};
