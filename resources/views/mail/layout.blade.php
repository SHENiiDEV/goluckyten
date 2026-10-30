<!doctype html>
<html><body style="margin:0;background:#0d0a12;font-family:Helvetica,Arial,sans-serif;color:#f5f2fa">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1523;border:1px solid #2e2640;border-radius:14px;padding:32px">
<tr><td style="padding-bottom:22px"><img src="{{ url('/images/brand/logo-h96.png') }}" alt="{{ config('app.name') }}" height="36" style="height:36px;width:auto;display:block"></td></tr>
<tr><td style="font-size:15px;line-height:1.6">@yield('body')</td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:#a39bb4">{{ config('company.name') }} &middot; {{ config('company.address') }}</td></tr>
</table></td></tr></table></body></html>
