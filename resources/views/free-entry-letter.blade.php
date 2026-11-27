<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Free entry letter {{ $entry->reference }}</title>
    <style>
        @page { size: A4; margin: 16mm 18mm; }
        * { box-sizing: border-box; }
        html { background: #e9e6ef; }
        body { margin: 0; font: 15px/1.5 Georgia, 'Times New Roman', serif; color: #111; }
        .bar { position: sticky; top: 0; display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap; padding: 12px 16px; background: #15111d; color: #e8e3f0; font: 14px/1.4 system-ui, sans-serif; }
        .bar button, .bar a { appearance: none; border: 0; border-radius: 10px; padding: 9px 16px; font: 600 14px system-ui, sans-serif; cursor: pointer; text-decoration: none; }
        .bar button { background: #7b5cfa; color: #fff; }
        .bar a { background: transparent; color: #c9c0dc; border: 1px solid #3a3249; }
        .sheet { width: 210mm; min-height: 297mm; margin: 24px auto; padding: 16mm 18mm; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,.18); }
        .row { display: flex; justify-content: space-between; gap: 24px; }
        .from { width: 48%; margin-left: auto; }
        .label { display: block; font: 11px/1.3 system-ui, sans-serif; color: #666; margin-bottom: 2px; }
        .line { border-bottom: 1px solid #999; height: 26px; }
        .to { margin-top: 18px; }
        .to p, .facts p { margin: 0; }
        .facts { margin: 26px 0 18px; padding: 12px 14px; border: 1.5px solid #111; border-radius: 6px; }
        .code { font: 700 22px/1.2 'Courier New', monospace; letter-spacing: 2px; }
        h2 { font-size: 15px; margin: 18px 0 4px; }
        .hint { font: 12px/1.4 system-ui, sans-serif; color: #666; margin: 0 0 6px; }
        .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 22px; }
        .cut { margin: 34px 0 16px; border-top: 1.5px dashed #888; position: relative; }
        .cut span { position: absolute; top: -9px; left: 0; background: #fff; padding-right: 8px; font: 11px system-ui, sans-serif; color: #666; }
        .envelope { display: inline-block; padding: 14px 18px; border: 1px solid #111; font-size: 17px; line-height: 1.45; }
        .rules { margin-top: 18px; font: 12px/1.5 system-ui, sans-serif; color: #444; }
        .rules li { margin-bottom: 2px; }
        @media (max-width: 860px) { .sheet { width: auto; min-height: 0; margin: 0; padding: 20px 16px; box-shadow: none; } .from { width: 100%; } }
        @media print { html { background: #fff; } .bar { display: none; } .sheet { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; } }
    </style>
</head>
<body>
    <div class="bar">
        <span>Print this, fill it in, sign it and post it. Or write the same details on any paper.</span>
        <button type="button" onclick="window.print()">Print letter</button>
        <a href="{{ route('free-entry') }}">Back to free entry</a>
    </div>

    <main class="sheet">
        <div class="from">
            <span class="label">Your full name</span><div class="line"></div>
            <span class="label" style="margin-top:8px">Your postal address</span><div class="line"></div><div class="line"></div><div class="line"></div>
        </div>

        <div class="to">
            <p>{{ $company }}</p>
            @foreach ($lines as $l)<p>{{ $l }}</p>@endforeach
        </div>

        <div class="row" style="margin-top:18px">
            <div style="width:48%"></div>
            <div style="width:48%"><span class="label">Date</span><div class="line"></div></div>
        </div>

        <div class="facts">
            <span class="label">Free entry code</span>
            <p class="code">{{ $entry->reference }}</p>
            <span class="label" style="margin-top:8px">Competition</span>
            <p>{{ $entry->raffle->title }} (draw {{ $entry->raffle->draws_at->timezone(config('company.timezone'))->format('j F Y') }})</p>
        </div>

        <p>Dear GoLuckyTen,</p>
        <h2>My request, in my own words</h2>
        <p class="hint">For example: “I would like to enter the {{ $entry->raffle->title }} competition for free.”</p>
        <div class="line"></div><div class="line"></div><div class="line"></div>

        <div class="sign">
            <div><span class="label">Email on my GoLuckyTen account</span><div class="line"></div></div>
            <div><span class="label">Signature</span><div class="line"></div></div>
        </div>

        <ul class="rules">
            <li>One letter per person per competition, in its own envelope, with enough postage.</li>
            <li>It must reach us before entries close on {{ $entry->raffle->draws_at->timezone(config('company.timezone'))->format('j F Y, H:i T') }}. Post it as early as you can.</li>
            <li>We can’t accept letters without this code, letters for someone else, bulk or unsigned letters.</li>
        </ul>

        <div class="cut"><span>✂ Cut out and stick on the envelope</span></div>
        <div class="envelope">
            {{ $company }}<br>
            @foreach ($lines as $l){{ $l }}<br>@endforeach
        </div>
    </main>
</body>
</html>
