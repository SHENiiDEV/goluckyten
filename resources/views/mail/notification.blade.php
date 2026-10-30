@extends('mail.layout')
@section('body')
<p>Hi {{ $name }},</p>
<p style="font-size:18px;font-weight:bold;color:#ffffff">{{ $title }}</p>
<p>{{ $body }}</p>
@if ($url)
<p><a href="{{ $url }}" style="display:inline-block;background:#7b5cfa;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">Open GoLuckyTen</a></p>
@endif
<p style="font-size:12px;color:#a39bb4">You can change which emails you get in your account settings.</p>
@endsection
