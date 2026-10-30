<?php

use App\Http\Controllers\Account;
use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BasketController;
use App\Http\Controllers\FreeEntryController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\LiveDrawController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\RaffleController;
use App\Http\Controllers\ReferralLinkController;
use App\Http\Controllers\WinnersController;
use Illuminate\Support\Facades\Route;

// LANDING_AS_HOME=true serves the landing page at / and moves the shop home to /home.
if (config('company.landing_as_home')) {
    Route::get('/', LandingController::class)->name('home');
    Route::get('/home', HomeController::class)->name('shop');
} else {
    Route::get('/', HomeController::class)->name('home');
}
Route::get('/landing', LandingController::class)->name('landing');
Route::get('/raffles', [RaffleController::class, 'index'])->name('raffles.index');
Route::get('/raffles/{raffle}', [RaffleController::class, 'show'])->name('raffles.show');
Route::get('/raffles/{raffle}/live', [LiveDrawController::class, 'show'])->name('raffles.live');
Route::get('/raffles/{raffle}/live/tickets.txt', [LiveDrawController::class, 'tickets'])->middleware('throttle:10,1')->name('raffles.live.tickets');
Route::get('/raffles/{raffle}/live/status', [LiveDrawController::class, 'status'])->middleware('throttle:120,1')->name('raffles.live.status');
Route::get('/raffles/{raffle}/numbers', [BasketController::class, 'numbers'])->middleware('throttle:60,1')->name('raffles.numbers');
Route::get('/r/{code}', ReferralLinkController::class)->name('referral');
Route::get('/winners', WinnersController::class)->name('winners');
Route::get('/players/{publicId}', [PlayerController::class, 'show'])->name('players.show');

Route::get('/how-it-works', [PageController::class, 'howItWorks'])->name('how-it-works');
Route::get('/terms', [PageController::class, 'terms'])->name('terms');
Route::get('/privacy', [PageController::class, 'privacy'])->name('privacy');
Route::get('/responsible-play', [PageController::class, 'responsible'])->name('responsible');
Route::get('/cookies', [PageController::class, 'cookies'])->name('cookies');

Route::post('/newsletter', [NewsletterController::class, 'store'])->middleware('throttle:6,1')->name('newsletter');

Route::get('/basket', [BasketController::class, 'show'])->name('basket');
Route::post('/basket', [BasketController::class, 'store'])->name('basket.store');
Route::patch('/basket/{raffle}', [BasketController::class, 'update'])->name('basket.update');
Route::post('/basket/promo', [BasketController::class, 'applyPromo'])->middleware('throttle:20,1')->name('basket.promo');
Route::delete('/basket/promo', [BasketController::class, 'removePromo'])->name('basket.promo.remove');
Route::delete('/basket/{raffle}', [BasketController::class, 'destroy'])->name('basket.destroy');

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/forgot-password', [PasswordResetController::class, 'request'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'email'])->middleware('throttle:5,1')->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'reset'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'update'])->name('password.update');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
    Route::post('/checkout', [BasketController::class, 'checkout'])->name('checkout');

    Route::get('/free-entry', [FreeEntryController::class, 'create'])->name('free-entry');
    Route::post('/free-entry', [FreeEntryController::class, 'store'])->middleware('throttle:10,1')->name('free-entry.store');

    Route::prefix('account')->name('account')->group(function () {
        Route::get('/', Account\DashboardController::class);
        Route::get('/orders/{order}', [Account\OrderController::class, 'show'])->name('.orders.show');
        Route::get('/orders/{order}/invoice', [Account\OrderController::class, 'invoice'])->name('.orders.invoice');
        Route::post('/orders/{order}/repeat', [BasketController::class, 'repeat'])->name('.orders.repeat');
        Route::get('/wallet', [Account\WalletController::class, 'show'])->name('.wallet');
        Route::post('/wallet/withdraw', [Account\WalletController::class, 'withdraw'])->middleware('throttle:5,1')->name('.wallet.withdraw');
        Route::get('/referrals', [Account\ReferralController::class, 'show'])->name('.referrals');
        Route::get('/safer-play', [Account\SafetyController::class, 'show'])->name('.safety');
        Route::post('/safer-play/limit', [Account\SafetyController::class, 'limit'])->name('.safety.limit');
        Route::delete('/safer-play/limit/pending', [Account\SafetyController::class, 'cancelPending'])->name('.safety.pending');
        Route::post('/safer-play/exclude', [Account\SafetyController::class, 'exclude'])->name('.safety.exclude');
        Route::post('/safer-play/reminder', [Account\SafetyController::class, 'reminder'])->name('.safety.reminder');
        Route::get('/notifications', [Account\NotificationController::class, 'index'])->name('.notifications');
        Route::get('/notifications/recent', [Account\NotificationController::class, 'recent'])->name('.notifications.recent');
        Route::post('/notifications/read', [Account\NotificationController::class, 'readAll'])->name('.notifications.read-all');
        Route::post('/notifications/{id}/read', [Account\NotificationController::class, 'read'])->name('.notifications.read');
        Route::put('/notifications/settings', [Account\NotificationController::class, 'settings'])->name('.notifications.settings');
        Route::post('/push', [Account\NotificationController::class, 'subscribe'])->name('.push.subscribe');
        Route::delete('/push', [Account\NotificationController::class, 'unsubscribe'])->name('.push.unsubscribe');
        Route::get('/data-export', [Account\PrivacyController::class, 'export'])->middleware('throttle:3,1')->name('.export');
        Route::delete('/', [Account\PrivacyController::class, 'destroy'])->name('.destroy');
        Route::get('/profile', [Account\ProfileController::class, 'edit'])->name('.profile');
        Route::put('/profile', [Account\ProfileController::class, 'update'])->name('.profile.update');
        Route::put('/password', [Account\ProfileController::class, 'password'])->name('.password');
    });
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', Admin\DashboardController::class)->name('dashboard');
    Route::get('/raffles', [Admin\RaffleController::class, 'index'])->name('raffles.index');
    Route::get('/raffles/create', [Admin\RaffleController::class, 'create'])->name('raffles.create');
    Route::post('/raffles', [Admin\RaffleController::class, 'store'])->name('raffles.store');
    Route::get('/raffles/{raffle}', [Admin\RaffleController::class, 'show'])->name('raffles.show');
    Route::get('/raffles/{raffle}/edit', [Admin\RaffleController::class, 'edit'])->name('raffles.edit');
    Route::post('/raffles/{raffle}', [Admin\RaffleController::class, 'update'])->name('raffles.update');
    Route::post('/raffles/{raffle}/winner', [Admin\RaffleController::class, 'winner'])->name('raffles.winner');
    Route::post('/raffles/{raffle}/draw', [Admin\RaffleController::class, 'draw'])->name('raffles.draw');
    Route::post('/raffles/{raffle}/instant-wins', [Admin\InstantWinController::class, 'store'])->name('instant-wins.store');
    Route::delete('/raffles/{raffle}/instant-wins', [Admin\InstantWinController::class, 'destroy'])->name('instant-wins.destroy');
    Route::get('/instant-wins', [Admin\InstantWinController::class, 'index'])->name('instant-wins.index');
    Route::post('/instant-wins/{prize}/fulfil', [Admin\InstantWinController::class, 'fulfil'])->name('instant-wins.fulfil');
    Route::get('/free-entries', [Admin\FreeEntryController::class, 'index'])->name('free-entries.index');
    Route::post('/free-entries/{freeEntry}/approve', [Admin\FreeEntryController::class, 'approve'])->name('free-entries.approve');
    Route::post('/free-entries/{freeEntry}/reject', [Admin\FreeEntryController::class, 'reject'])->name('free-entries.reject');
    Route::get('/users', [Admin\UserController::class, 'index'])->name('users.index');
    Route::get('/orders', [Admin\OrderController::class, 'index'])->name('orders.index');
    Route::get('/promo-codes', [Admin\PromoCodeController::class, 'index'])->name('promo-codes.index');
    Route::post('/promo-codes', [Admin\PromoCodeController::class, 'store'])->name('promo-codes.store');
    Route::put('/promo-codes/{promo}', [Admin\PromoCodeController::class, 'update'])->name('promo-codes.update');
    Route::delete('/promo-codes/{promo}', [Admin\PromoCodeController::class, 'destroy'])->name('promo-codes.destroy');
    Route::get('/withdrawals', [Admin\WithdrawalController::class, 'index'])->name('withdrawals.index');
    Route::post('/withdrawals/{withdrawal}/paid', [Admin\WithdrawalController::class, 'paid'])->name('withdrawals.paid');
    Route::post('/withdrawals/{withdrawal}/reject', [Admin\WithdrawalController::class, 'reject'])->name('withdrawals.reject');
});
