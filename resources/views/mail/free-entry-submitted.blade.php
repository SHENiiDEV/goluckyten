@extends('mail.layout')
@section('body')
@php
    $lines = \App\Models\FreeEntryRequest::postalAddressLines();
@endphp
<p>Hi {{ $entry->user->name ?? $entry->full_name }},</p>
<p>Here is your personal free entry code for <strong>{{ $entry->raffle->title }}</strong>:</p>
<p style="font-size:28px;font-weight:800;letter-spacing:2px;margin:18px 0;">{{ $entry->reference }}</p>
<p><strong>One more step:</strong> write us a letter with this code and post it, by ordinary post, to:</p>
<p style="background:#1b1525;border-radius:10px;padding:12px 14px;line-height:1.6;">{{ config('company.name') }}<br>@foreach ($lines as $l){{ $l }}<br>@endforeach</p>
<p>It must reach us before entries close on {{ $entry->raffle->draws_at->timezone(config('company.timezone'))->format('j F Y, H:i T') }}, so post it as early as you can. Use enough postage; one letter per envelope.</p>
<p>Your letter should look like this. Replace everything in [brackets] with your details and sign it:</p>
<pre style="background:#1b1525;border-radius:10px;padding:14px;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.55;white-space:pre-wrap;">{{ $entry->letterTemplate() }}</pre>
<p><a href="{{ route('free-entry.letter', $entry->reference) }}">Print a ready-made letter to fill in</a></p>
<p>Once your letter arrives and we’ve checked it, your free ticket is added to your account and we email you its number. It has exactly the same chance of winning as a paid ticket.</p>
@endsection
