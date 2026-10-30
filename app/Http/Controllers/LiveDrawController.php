<?php

namespace App\Http\Controllers;

use App\Models\Raffle;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveDrawController extends Controller
{
    public function show(Request $request, Raffle $raffle): Response
    {
        abort_if($raffle->status === Raffle::STATUS_DRAFT, 404);
        $user = $request->user();

        return Inertia::render('Raffles/Live', [
            'raffle' => $raffle->loadCount('tickets')->toCard(),
            'state' => $this->state($raffle),
            'myNumbers' => $user ? Ticket::where('raffle_id', $raffle->id)->where('user_id', $user->id)->orderBy('number')->take(200)->pluck('number') : [],
        ]);
    }

    public function status(Raffle $raffle): JsonResponse
    {
        abort_if($raffle->status === Raffle::STATUS_DRAFT, 404);

        return response()->json($this->state($raffle->fresh()));
    }

    /** Every issued number in draw order, so anyone can count to the winning index themselves. */
    public function tickets(Raffle $raffle): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_unless($raffle->status === Raffle::STATUS_DRAWN, 404);

        return response()->streamDownload(function () use ($raffle) {
            foreach (Ticket::where('raffle_id', $raffle->id)->orderBy('number')->toBase()->select('number')->cursor() as $t) {
                echo $t->number, "\n";
            }
        }, "goluckyten-{$raffle->slug}-tickets.txt", ['Content-Type' => 'text/plain']);
    }

    private function state(Raffle $raffle): array
    {
        $drawn = $raffle->status === Raffle::STATUS_DRAWN;
        // Draws made before commit-reveal was introduced have no audit; don't reveal a seed that wasn't used.
        $verifiable = $drawn && $raffle->draw_audit;
        $winner = $drawn ? $raffle->winnerTicket()->with('user:id,name,surname,city,public_id,profile_public')->first() : null;

        return [
            'status' => $raffle->status,
            'draws_at' => $raffle->draws_at->toIso8601String(),
            'server_now' => now()->toIso8601String(),
            'ticket_count' => Ticket::where('raffle_id', $raffle->id)->count(),
            'max_tickets' => $raffle->max_tickets,
            'seed_hash' => ($drawn && ! $verifiable) ? null : $raffle->draw_seed_hash,
            // The seed is only revealed once the draw is done.
            'seed' => $verifiable ? $raffle->draw_seed : null,
            'audit' => $verifiable ? $raffle->draw_audit : null,
            'legacy' => $drawn && ! $verifiable,
            'drawn_at' => $raffle->drawn_at?->toIso8601String(),
            'winner' => $winner ? [
                'number' => $winner->number,
                ...$winner->user->publicRef(),
                'city' => $winner->user->city,
            ] : null,
        ];
    }
}
