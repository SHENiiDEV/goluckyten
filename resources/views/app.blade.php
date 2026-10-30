<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#0D0A12">
        <link rel="icon" href="/images/brand/favicon-32.png" type="image/png" sizes="32x32">
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="apple-touch-icon" href="/images/brand/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="GoLuckyTen">
        <meta name="description" content="Win cars, watches, tech and cash from 10c a ticket. Fixed ticket limits, published draw dates and a free entry route on every competition.">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image" content="{{ url('/images/brand/og.jpg') }}">
        @include('partials.splash')
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        <x-inertia::head>
            <title>{{ config('app.name') }}</title>
        </x-inertia::head>
    </head>
    <body class="antialiased">
        @include('partials.splash-markup')
        <x-inertia::app />
    </body>
</html>
