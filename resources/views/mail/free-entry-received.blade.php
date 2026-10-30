@extends('mail.layout')
@section('body')
<p><strong>New free entry request {{ $entry->reference }}</strong></p>
<p>Raffle: {{ $entry->raffle->title }}<br>
Name: {{ $entry->full_name }}<br>
Email: {{ $entry->email }}<br>
Account: {{ $entry->user->email }}<br>
Address: {{ $entry->address }}</p>
<p>Statement:<br><em>{{ $entry->statement }}</em></p>
<p><a href="{{ route('admin.free-entries.index') }}" style="color:#a48bff">Review in the admin panel</a></p>
@endsection
