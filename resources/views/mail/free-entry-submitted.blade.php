@extends('mail.layout')
@section('body')
<p>Hi {{ $entry->full_name }},</p>
<p>We received your free entry request <strong>{{ $entry->reference }}</strong> for <strong>{{ $entry->raffle->title }}</strong>.</p>
<p>Once it’s checked, your free ticket is added to your account and has exactly the same chance of winning as a paid ticket. We’ll email you when that happens.</p>
@endsection
