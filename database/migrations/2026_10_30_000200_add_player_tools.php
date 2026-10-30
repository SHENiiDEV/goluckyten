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
            // Wallet & referrals
            $table->integer('wallet_balance_cents')->default(0);
            $table->string('referral_code', 12)->nullable()->unique();
            $table->foreignId('referred_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('referral_rewarded_at')->nullable();
            // Responsible play
            $table->unsignedInteger('spend_limit_cents')->nullable();
            $table->string('spend_limit_period', 8)->nullable(); // day, week, month
            $table->unsignedInteger('pending_spend_limit_cents')->nullable();
            $table->string('pending_spend_limit_period', 8)->nullable();
            $table->timestamp('pending_spend_limit_at')->nullable();
            $table->boolean('pending_spend_limit_remove')->default(false);
            $table->timestamp('excluded_until')->nullable();
            $table->unsignedSmallInteger('session_reminder_minutes')->nullable()->default(60);
            // Notifications
            $table->json('favourite_categories')->nullable();
            $table->boolean('notify_draw_reminders')->default(true);
            $table->boolean('notify_new_competitions')->default(true);
            // GDPR
            $table->timestamp('anonymised_at')->nullable();
        });

        foreach (DB::table('users')->whereNull('referral_code')->pluck('id') as $id) {
            DB::table('users')->where('id', $id)->update(['referral_code' => Str::upper(Str::random(8))]);
        }

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('amount_cents'); // + credit, - debit
            $table->integer('balance_after_cents');
            $table->string('type', 24); // instant_win, referral, purchase, withdrawal, refund, adjustment
            $table->string('description');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('instant_win_prize_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount_cents');
            $table->string('account_name');
            $table->string('iban', 40);
            $table->string('status', 12)->default('pending'); // pending, paid, rejected
            $table->text('admin_note')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('type', 8); // percent, fixed
            $table->unsignedInteger('value'); // percent (1-100) or cents
            $table->unsignedInteger('min_spend_cents')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('uses_count')->default(0);
            $table->unsignedInteger('per_user_limit')->default(1);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('promo_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promo_code_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('discount_cents');
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedInteger('subtotal_cents')->default(0)->after('user_id');
            $table->unsignedInteger('discount_cents')->default(0)->after('subtotal_cents');
            $table->unsignedInteger('wallet_cents')->default(0)->after('discount_cents');
            $table->foreignId('promo_code_id')->nullable()->after('wallet_cents')->constrained()->nullOnDelete();
            $table->string('invoice_number', 32)->nullable()->unique()->after('reference');
        });

        Schema::table('raffles', function (Blueprint $table) {
            $table->unsignedInteger('sale_price_cents')->nullable()->after('ticket_price_cents');
            $table->timestamp('sale_ends_at')->nullable()->after('sale_price_cents');
            $table->boolean('auto_draw')->default(true)->after('draws_at');
            $table->string('draw_seed_hash', 64)->nullable();
            $table->string('draw_seed', 64)->nullable();
            $table->json('draw_audit')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamp('announced_at')->nullable();
        });

        foreach (DB::table('raffles')->whereNull('draw_seed')->pluck('id') as $id) {
            $seed = bin2hex(random_bytes(32));
            DB::table('raffles')->where('id', $id)->update(['draw_seed' => $seed, 'draw_seed_hash' => hash('sha256', $seed)]);
        }

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('endpoint_hash', 64)->unique();
            $table->string('public_key');
            $table->string('auth_token');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
        Schema::dropIfExists('notifications');
        Schema::table('raffles', fn (Blueprint $t) => $t->dropColumn(['sale_price_cents', 'sale_ends_at', 'auto_draw', 'draw_seed_hash', 'draw_seed', 'draw_audit', 'reminder_sent_at', 'announced_at']));
        Schema::table('orders', function (Blueprint $t) {
            $t->dropConstrainedForeignId('promo_code_id');
            $t->dropColumn(['subtotal_cents', 'discount_cents', 'wallet_cents', 'invoice_number']);
        });
        Schema::dropIfExists('promo_redemptions');
        Schema::dropIfExists('promo_codes');
        Schema::dropIfExists('withdrawal_requests');
        Schema::dropIfExists('wallet_transactions');
        Schema::table('users', function (Blueprint $t) {
            $t->dropConstrainedForeignId('referred_by_id');
            $t->dropColumn(['wallet_balance_cents', 'referral_code', 'referral_rewarded_at', 'spend_limit_cents', 'spend_limit_period', 'pending_spend_limit_cents', 'pending_spend_limit_period', 'pending_spend_limit_at', 'pending_spend_limit_remove', 'excluded_until', 'session_reminder_minutes', 'favourite_categories', 'notify_draw_reminders', 'notify_new_competitions', 'anonymised_at']);
        });
    }
};
