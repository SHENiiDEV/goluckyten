<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('raffles', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('title');
            $table->json('gallery')->nullable()->after('image_path');
            $table->string('video_path')->nullable()->after('gallery');
        });

        Schema::create('instant_win_prizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raffle_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('prize_type', 8); // cash, item
            $table->unsignedInteger('value_cents');
            $table->string('image_path')->nullable();
            $table->unsignedInteger('ticket_number');
            $table->foreignId('ticket_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('won_at')->nullable();
            $table->string('fulfilment_status', 12)->nullable(); // pending, paid, shipped
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamps();

            $table->unique(['raffle_id', 'ticket_number']);
            $table->index(['raffle_id', 'won_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instant_win_prizes');
        Schema::table('raffles', function (Blueprint $table) {
            $table->dropColumn(['brand', 'gallery', 'video_path']);
        });
    }
};
