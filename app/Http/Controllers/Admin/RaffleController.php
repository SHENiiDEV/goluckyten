<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Raffle;
use App\Models\Ticket;
use App\Services\DrawService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RaffleController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $query = Raffle::withCardCounts()->latest('draws_at');
        if ($status && in_array($status, Raffle::STATUSES)) {
            $query->where('status', $status);
        }

        return Inertia::render('Admin/Raffles/Index', [
            'raffles' => $query->get()->map->toCard(),
            'filters' => ['status' => $status],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Raffles/Form', [
            'raffle' => null,
            'categories' => $this->categories(),
            'ticketDefaults' => $this->ticketDefaults(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['image_path'] = $request->file('image')?->store('raffles', 'public');
        $data['gallery'] = collect($request->file('gallery', []))->map(fn ($f) => $f->store('raffles', 'public'))->all();
        $data['video_path'] = $request->file('video')?->store('raffles/video', 'public');

        $raffle = Raffle::create($data);

        return redirect()->route('admin.raffles.show', $raffle)->with('success', 'Raffle created.');
    }

    public function show(Raffle $raffle): Response
    {
        $raffle->loadCount('tickets')->load('winnerTicket.user');
        $instant = $raffle->instantWinPrizes()->with('user:id,name,surname')->orderByDesc('value_cents')->orderBy('ticket_number')->get();

        $tickets = Ticket::where('raffle_id', $raffle->id)->with('user:id,name,surname,email,city,country')
            ->latest()->paginate(50);

        return Inertia::render('Admin/Raffles/Show', [
            'raffle' => [
                ...$raffle->toCard(),
                'paid_tickets' => $raffle->tickets()->where('entry_type', Ticket::TYPE_PAID)->count(),
                'free_tickets' => $raffle->tickets()->where('entry_type', Ticket::TYPE_FREE)->count(),
                'revenue_cents' => (int) $raffle->tickets()->where('entry_type', Ticket::TYPE_PAID)->count() * $raffle->ticket_price_cents,
                'players' => $raffle->tickets()->distinct('user_id')->count('user_id'),
                'winner_story' => $raffle->winner_story,
                'winner_photo_url' => \App\Support\MediaUrl::to($raffle->winner_photo_path),
                'winner' => $raffle->winnerTicket ? [
                    'number' => $raffle->winnerTicket->number,
                    'entry_type' => $raffle->winnerTicket->entry_type,
                    'name' => $raffle->winnerTicket->user->full_name,
                    'email' => $raffle->winnerTicket->user->email,
                    'phone' => $raffle->winnerTicket->user->phone,
                    'address' => $raffle->winnerTicket->user->fullAddress(),
                ] : null,
            ],
            'instantPrizes' => $instant->groupBy(fn ($p) => $p->title.'|'.$p->value_cents)->map(fn ($g) => [
                'title' => $g->first()->title,
                'type' => $g->first()->prize_type,
                'value_cents' => $g->first()->value_cents,
                'total' => $g->count(),
                'claimed' => $g->whereNotNull('ticket_id')->count(),
                'numbers' => $g->map(fn ($p) => ['n' => $p->ticket_number, 'won_by' => $p->user?->full_name])->values(),
            ])->values(),
            'tickets' => $tickets->through(fn ($t) => [
                'number' => $t->number,
                'entry_type' => $t->entry_type,
                'user' => $t->user->full_name,
                'email' => $t->user->email,
                'created_at' => $t->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function edit(Raffle $raffle): Response
    {
        return Inertia::render('Admin/Raffles/Form', [
            'raffle' => [
                ...$raffle->only(['id', 'slug', 'title', 'brand', 'promo_label', 'headline', 'subtitle', 'description', 'category', 'retail_value_cents', 'cash_alternative_cents', 'ticket_price_cents', 'max_tickets', 'max_per_user', 'free_entry_enabled', 'featured', 'status', 'sale_price_cents', 'auto_draw']),
                'sale_ends_at' => $raffle->sale_ends_at?->format('Y-m-d\TH:i'),
                'highlights' => implode("\n", $raffle->highlights ?? []),
                'draws_at' => $raffle->draws_at->format('Y-m-d\TH:i'),
                'image_url' => $raffle->imageUrl(),
                'gallery' => collect($raffle->gallery ?? [])->map(fn ($p) => ['path' => $p, 'url' => \App\Support\MediaUrl::to($p)])->values(),
                'video_url' => $raffle->videoUrl(),
                'tickets_sold' => $raffle->tickets()->count(),
            ],
            'categories' => $this->categories(),
            'ticketDefaults' => $this->ticketDefaults(),
        ]);
    }

    public function update(Request $request, Raffle $raffle): RedirectResponse
    {
        $data = $this->validated($request, $raffle);

        if ($request->hasFile('image')) {
            $raffle->image_path && Storage::disk('public')->delete($raffle->image_path);
            $data['image_path'] = $request->file('image')->store('raffles', 'public');
        } elseif ($request->boolean('remove_image') && $raffle->image_path) {
            Storage::disk('public')->delete($raffle->image_path);
            $data['image_path'] = null;
        }
        $gallery = array_values(array_diff($raffle->gallery ?? [], $request->input('remove_gallery', [])));
        foreach (array_diff($raffle->gallery ?? [], $gallery) as $gone) {
            ! str_starts_with($gone, '/') && Storage::disk('public')->delete($gone);
        }
        foreach ($request->file('gallery', []) as $file) {
            $gallery[] = $file->store('raffles', 'public');
        }
        $data['gallery'] = $gallery;

        if ($request->hasFile('video')) {
            $raffle->video_path && ! str_starts_with($raffle->video_path, '/') && Storage::disk('public')->delete($raffle->video_path);
            $data['video_path'] = $request->file('video')->store('raffles/video', 'public');
        } elseif ($request->boolean('remove_video')) {
            $data['video_path'] = null;
        }

        $sold = $raffle->tickets()->count();
        if ($data['max_tickets'] < $sold) {
            return back()->withErrors(['max_tickets' => "{$sold} tickets are already sold; the total can’t go lower."]);
        }

        $raffle->update($data);

        return redirect()->route('admin.raffles.show', $raffle)->with('success', 'Raffle saved.');
    }

    public function winner(Request $request, Raffle $raffle): RedirectResponse
    {
        abort_unless($raffle->status === Raffle::STATUS_DRAWN, 422);
        $data = $request->validate([
            'winner_story' => ['nullable', 'string', 'max:1000'],
            'winner_photo' => ['nullable', 'image', 'max:6144'],
        ]);

        $update = ['winner_story' => $data['winner_story'] ?? null];
        if ($request->hasFile('winner_photo')) {
            $raffle->winner_photo_path && ! str_starts_with($raffle->winner_photo_path, '/') && ! str_starts_with($raffle->winner_photo_path, 'http')
                && Storage::disk('public')->delete($raffle->winner_photo_path);
            $update['winner_photo_path'] = $request->file('winner_photo')->store('winners', 'public');
        }
        $raffle->update($update);

        return back()->with('success', 'Winner story saved.');
    }

    public function draw(Raffle $raffle, DrawService $draws): RedirectResponse
    {
        $winner = $draws->draw($raffle);

        return back()->with('success', "Winning ticket: #{$winner->number}.");
    }

    private function validated(Request $request, ?Raffle $raffle = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'subtitle' => ['nullable', 'string', 'max:200'],
            'description' => ['required', 'string', 'max:5000'],
            'highlights' => ['nullable', 'string', 'max:2000'],
            'category' => ['required', Rule::in(array_keys(Raffle::CATEGORIES))],
            'retail_value' => ['required', 'numeric', 'min:1'],
            'cash_alternative' => ['nullable', 'numeric', 'min:0'],
            'ticket_price' => ['required', 'numeric', 'min:0.01'],
            'max_tickets' => ['required', 'integer', 'min:1', 'max:50000000'],
            'max_per_user' => ['required', 'integer', 'min:1'],
            'free_entry_enabled' => ['boolean'],
            'featured' => ['boolean'],
            'status' => ['required', Rule::in($raffle?->status === Raffle::STATUS_DRAWN ? [Raffle::STATUS_DRAWN] : [Raffle::STATUS_DRAFT, Raffle::STATUS_LIVE, Raffle::STATUS_CLOSED])],
            'draws_at' => ['required', 'date'],
            'brand' => ['nullable', 'string', 'max:80'],
            'promo_label' => ['nullable', 'string', 'max:40'],
            'headline' => ['nullable', 'string', 'max:120'],
            'image' => ['nullable', 'image', 'max:6144'],
            'remove_image' => ['nullable', 'boolean'],
            'gallery' => ['nullable', 'array', 'max:12'],
            'gallery.*' => ['image', 'max:6144'],
            'remove_gallery' => ['nullable', 'array'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm', 'max:51200'],
            'remove_video' => ['nullable', 'boolean'],
            'sale_price' => ['nullable', 'numeric', 'min:0.01', 'lt:ticket_price'],
            'sale_ends_at' => ['nullable', 'required_with:sale_price', 'date'],
            'auto_draw' => ['boolean'],
        ], ['sale_price.lt' => 'The sale price must be lower than the normal ticket price.']);

        return [
            'title' => $data['title'],
            'brand' => $data['brand'] ?? null,
            'promo_label' => $data['promo_label'] ?? null,
            'headline' => $data['headline'] ?? null,
            'subtitle' => $data['subtitle'] ?? null,
            'description' => $data['description'],
            'highlights' => array_values(array_filter(array_map('trim', preg_split('/\R/', $data['highlights'] ?? '')))),
            'category' => $data['category'],
            'retail_value_cents' => (int) round($data['retail_value'] * 100),
            'cash_alternative_cents' => isset($data['cash_alternative']) && $data['cash_alternative'] !== '' ? (int) round($data['cash_alternative'] * 100) : null,
            'ticket_price_cents' => (int) round($data['ticket_price'] * 100),
            'max_tickets' => (int) $data['max_tickets'],
            'max_per_user' => (int) $data['max_per_user'],
            'free_entry_enabled' => $request->boolean('free_entry_enabled'),
            'featured' => $request->boolean('featured'),
            'status' => $data['status'],
            'draws_at' => $data['draws_at'],
            'sale_price_cents' => isset($data['sale_price']) && $data['sale_price'] !== '' ? (int) round($data['sale_price'] * 100) : null,
            'sale_ends_at' => ! empty($data['sale_price']) ? ($data['sale_ends_at'] ?? null) : null,
            'auto_draw' => $request->boolean('auto_draw', true),
        ];
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'raffle';
        $slug = $base;
        $i = 2;
        while (Raffle::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    private function ticketDefaults(): array
    {
        return [
            'price_cents' => config('company.ticket_price_cents'),
            'multiplier' => config('company.ticket_value_multiplier'),
        ];
    }

    private function categories(): array
    {
        return collect(Raffle::CATEGORIES)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values()->all();
    }
}
