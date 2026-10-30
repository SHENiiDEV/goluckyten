@extends('mail.layout')
@section('body')
<p>Hi {{ $entry->full_name }},</p>
@if ($ticketNumber)
<p>Your free entry for <strong>{{ $entry->raffle->title }}</strong> is confirmed. Your ticket number is <strong style="color:#a48bff">#{{ $ticketNumber }}</strong>.</p>
<p>The draw takes place on {{ $entry->raffle->draws_at->format('j F Y, H:i') }}. Good luck!</p>
@else
<p>We couldn’t accept your free entry request <strong>{{ $entry->reference }}</strong> for {{ $entry->raffle->title }}.</p>
<p>Reason: {{ $entry->admin_note }}</p>
@endif
<p><a href="{{ route('account') }}" style="color:#a48bff">View your tickets</a></p>
@endsection
