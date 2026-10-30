<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raffles', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->text('description');
            $table->json('highlights')->nullable();
            $table->string('category', 32)->index();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('retail_value_cents');
            $table->unsignedInteger('cash_alternative_cents')->nullable();
            $table->unsignedInteger('ticket_price_cents');
            $table->unsignedInteger('max_tickets');
            $table->unsignedInteger('max_per_user')->default(100);
            $table->boolean('free_entry_enabled')->default(true);
            $table->boolean('featured')->default(false);
            $table->string('status', 16)->default('draft')->index(); // draft, live, closed, drawn
            $table->timestamp('draws_at');
            $table->timestamp('drawn_at')->nullable();
            $table->unsignedBigInteger('winner_ticket_id')->nullable();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total_cents');
            $table->string('currency', 3)->default('EUR');
            $table->string('status', 16)->default('pending'); // pending, paid, failed, refunded
            $table->string('payment_method', 32)->default('stub');
            $table->string('payment_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('raffle_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedInteger('total_cents');
            $table->timestamps();
        });

        Schema::create('free_entry_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('raffle_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('email');
            $table->text('address');
            $table->text('statement');
            $table->string('status', 16)->default('pending'); // pending, approved, rejected
            $table->text('admin_note')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'raffle_id']);
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raffle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('free_entry_request_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('number');
            $table->string('entry_type', 8); // paid, free
            $table->timestamps();

            $table->unique(['raffle_id', 'number']);
            $table->index(['raffle_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('free_entry_requests');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('raffles');
    }
};
