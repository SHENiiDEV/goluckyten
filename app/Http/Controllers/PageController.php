<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function howItWorks(): Response
    {
        return Inertia::render('Pages/HowItWorks');
    }

    public function terms(): Response
    {
        return Inertia::render('Pages/Terms', ['updated' => '30 October 2026', 'minAge' => config('company.min_age'), 'restricted' => $this->restricted()]);
    }

    public function privacy(): Response
    {
        return Inertia::render('Pages/Privacy', ['updated' => '30 October 2026']);
    }

    public function responsible(): Response
    {
        return Inertia::render('Pages/Responsible', ['updated' => '30 October 2026']);
    }

    public function cookies(): Response
    {
        return Inertia::render('Pages/Cookies', ['updated' => '30 October 2026']);
    }

    private function restricted(): array
    {
        $all = config('countries.all');

        return collect(config('countries.restricted'))->map(fn ($c) => $all[$c] ?? $c)->sort()->values()->all();
    }
}
