@php($m = fn (int $c) => \App\Support\Money::format($c, $order->currency))
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice {{ $order->invoice_number }}</title>
<style>
    @page { margin: 36px 42px; }
    * { box-sizing: border-box; }
    body { font-family: Helvetica, Arial, sans-serif; color: #111; font-size: 12px; line-height: 1.45; margin: 0; }
    .row { width: 100%; }
    .row td { vertical-align: top; }
    h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -0.5px; }
    .muted { color: #666; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #777; margin-bottom: 4px; }
    table.items { width: 100%; border-collapse: collapse; margin-top: 28px; }
    table.items th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #555; border-bottom: 2px solid #111; padding: 8px 6px; }
    table.items td { border-bottom: 1px solid #ddd; padding: 10px 6px; }
    .num { text-align: right; white-space: nowrap; }
    table.totals { margin-top: 16px; margin-left: auto; width: 280px; border-collapse: collapse; }
    table.totals td { padding: 5px 6px; }
    table.totals tr.grand td { border-top: 2px solid #111; font-size: 15px; font-weight: bold; padding-top: 10px; }
    .box { border: 1px solid #ddd; padding: 12px 14px; border-radius: 6px; }
    .footer { margin-top: 40px; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 12px; }
</style>
</head>
<body>
<table class="row" cellspacing="0">
    <tr>
        <td>
            @if ($logo)<img src="{{ $logo }}" alt="GoLuckyTen" style="height:34px">@else<strong style="font-size:22px">GoLuckyTen</strong>@endif
            <div class="muted" style="margin-top:10px">
                {{ config('company.name') }}<br>
                {{ config('company.address') }}<br>
                Company no. {{ config('company.number') }}
                @if (config('company.vat_number'))<br>VAT no. {{ config('company.vat_number') }}@endif<br>
                {{ config('company.email') }}
            </div>
        </td>
        <td style="text-align:right">
            <h1>Invoice</h1>
            <div><strong>{{ $order->invoice_number }}</strong></div>
            <div class="muted">Date {{ ($order->paid_at ?? $order->created_at)->format('j F Y') }}</div>
            <div class="muted">Order {{ $order->reference }}</div>
        </td>
    </tr>
</table>

<table class="row" cellspacing="0" style="margin-top:28px">
    <tr>
        <td style="width:50%;padding-right:10px">
            <div class="box">
                <div class="label">Billed to</div>
                <strong>{{ $order->user->full_name }}</strong><br>
                {{ $order->user->address_line }}<br>
                {{ $order->user->city }}, {{ $order->user->post_code }}<br>
                {{ $order->user->countryName() }}<br>
                {{ $order->user->email }}
            </div>
        </td>
        <td style="width:50%;padding-left:10px">
            <div class="box">
                <div class="label">Payment</div>
                Status: <strong>{{ ucfirst($order->status) }}</strong><br>
                Method: {{ $order->payment_method === 'wallet' ? 'GoLuckyTen balance' : ucfirst($order->payment_method) }}<br>
                @if ($order->payment_reference)Reference: {{ $order->payment_reference }}<br>@endif
                Currency: {{ $order->currency }}
            </div>
        </td>
    </tr>
</table>

<table class="items">
    <thead>
        <tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>
        @foreach ($order->items as $item)
            <tr>
                <td>
                    <strong>Competition entry: {{ $item->raffle->title }}</strong><br>
                    <span class="muted">Draw {{ $item->raffle->draws_at->format('j F Y, H:i') }}. Ticket numbers are listed in your account.</span>
                </td>
                <td class="num">{{ number_format($item->quantity) }}</td>
                <td class="num">{{ $m($item->unit_price_cents) }}</td>
                <td class="num">{{ $m($item->total_cents) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<table class="totals">
    <tr><td>Subtotal</td><td class="num">{{ $m($order->subtotal_cents ?: $order->total_cents) }}</td></tr>
    @if ($order->discount_cents > 0)
        <tr><td>Discount{{ $order->promoCode ? ' ('.$order->promoCode->code.')' : '' }}</td><td class="num">−{{ $m($order->discount_cents) }}</td></tr>
    @endif
    @if ($vatRate > 0)
        <tr><td class="muted">Includes VAT {{ rtrim(rtrim(number_format($vatRate, 2), '0'), '.') }}%</td><td class="num muted">{{ $m($vatCents) }}</td></tr>
    @endif
    <tr class="grand"><td>Total</td><td class="num">{{ $m($order->total_cents) }}</td></tr>
    @if ($order->wallet_cents > 0)
        <tr><td class="muted">Paid from balance</td><td class="num muted">{{ $m($order->wallet_cents) }}</td></tr>
        <tr><td class="muted">Paid by {{ $order->payment_method === 'wallet' ? '—' : 'card' }}</td><td class="num muted">{{ $m($order->chargedCents()) }}</td></tr>
    @endif
</table>

<div class="footer">
    Thank you for playing. Entries are non-refundable once issued except where a competition is cancelled, as set out in our Terms &amp; Conditions.
    18+ only. Please play responsibly.
</div>
</body>
</html>
