@extends('mail.layout')
@php($m = fn (int $c) => \App\Support\Money::format($c, $order->currency))
@section('body')
<p>Hi {{ $order->user->name }},</p>
<p style="font-size:20px;font-weight:bold;color:#ffffff;margin:0 0 6px">You’re in. Good luck!</p>
<p>Order <strong>{{ $order->reference }}</strong> is confirmed. Your invoice {{ $order->invoice_number }} is attached.</p>

@if ($wins->isNotEmpty())
<div style="background:#f6c453;color:#0d0a12;border-radius:12px;padding:14px 16px;margin:18px 0">
    <strong>Instant win!</strong>
    @foreach ($wins as $w)
        <br>{{ $w->title }} on ticket #{{ number_format($w->ticket_number) }}
    @endforeach
    <br><span style="font-size:13px">Cash prizes are already in your GoLuckyTen balance.</span>
</div>
@endif

@foreach ($order->items as $item)
    @php($nums = ($byRaffle[$item->raffle_id] ?? collect())->pluck('number')->sort()->values())
    <div style="border:1px solid #2e2640;border-radius:12px;padding:14px 16px;margin:12px 0">
        <strong style="color:#ffffff">{{ $item->raffle->title }}</strong><br>
        <span style="color:#a39bb4;font-size:13px">{{ number_format($item->quantity) }} × {{ $m($item->unit_price_cents) }}, draw {{ $item->raffle->draws_at->format('j M Y, H:i') }}</span>
        <p style="margin:10px 0 0;font-family:monospace;font-size:13px;color:#c3b3ff;line-height:1.7">
            {{ $nums->take(100)->map(fn ($n) => '#'.number_format($n))->implode('  ') }}
            @if ($nums->count() > 100)<br><span style="color:#a39bb4">and {{ number_format($nums->count() - 100) }} more in your account</span>@endif
        </p>
    </div>
@endforeach

<p style="font-size:16px">Total paid: <strong style="color:#ffffff">{{ $m($order->total_cents) }}</strong>
@if ($order->discount_cents > 0)<br><span style="font-size:13px;color:#a39bb4">Includes a {{ $m($order->discount_cents) }} discount</span>@endif
@if ($order->wallet_cents > 0)<br><span style="font-size:13px;color:#a39bb4">{{ $m($order->wallet_cents) }} from your balance</span>@endif
</p>
<p><a href="{{ url('/account/orders/'.$order->reference) }}" style="display:inline-block;background:#7b5cfa;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">View my tickets</a></p>
<p style="font-size:12px;color:#a39bb4">18+ only. Please play responsibly. You can set spend limits in your account.</p>
@endsection
