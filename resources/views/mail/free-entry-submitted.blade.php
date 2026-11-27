@extends('mail.layout')
@section('body')
@php
    $to = config('company.free_entry_email');
    $mailto = 'mailto:'.$to.'?subject='.rawurlencode($entry->emailSubject()).'&body='.rawurlencode($entry->emailTemplate());
@endphp
<p>Hi {{ $entry->user->name ?? $entry->full_name }},</p>
<p>Here is your personal free entry code for <strong>{{ $entry->raffle->title }}</strong>:</p>
<p style="font-size:28px;font-weight:800;letter-spacing:2px;margin:18px 0;">{{ $entry->reference }}</p>
<p><strong>One more step:</strong> send us an email from <strong>{{ $entry->email }}</strong> (the address on your account) to <a href="mailto:{{ $to }}">{{ $to }}</a> before the draw on {{ $entry->raffle->draws_at->format('j F Y, H:i') }}.</p>
<p>Use this subject:</p>
<p style="background:#1b1525;border-radius:10px;padding:12px 14px;font-family:Menlo,Consolas,monospace;font-size:13px;">{{ $entry->emailSubject() }}</p>
<p>And copy this into the message, replacing everything in [brackets]:</p>
<pre style="background:#1b1525;border-radius:10px;padding:14px;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.55;white-space:pre-wrap;">{{ $entry->emailTemplate() }}</pre>
<p><a href="{{ $mailto }}">Open it in my email app</a></p>
<p>Once we’ve checked it, usually within one working day, your free ticket is added to your account. It has exactly the same chance of winning as a paid ticket.</p>
@endsection
