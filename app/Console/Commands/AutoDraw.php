<?php

namespace App\Console\Commands;

use App\Models\Raffle;
use App\Models\Ticket;
use App\Services\DrawService;
use Illuminate\Console\Command;

class AutoDraw extends Command
{
    protected $signature = 'raffles:auto-draw';

    protected $description = 'Close competitions past their draw time and draw the ones set to auto-draw';

    public function handle(DrawService $draws): int
    {
        Raffle::where('status', Raffle::STATUS_LIVE)->where('draws_at', '<=', now())->update(['status' => Raffle::STATUS_CLOSED]);

        $due = Raffle::where('status', Raffle::STATUS_CLOSED)->where('auto_draw', true)->where('draws_at', '<=', now())->get();
        foreach ($due as $raffle) {
            if (! Ticket::where('raffle_id', $raffle->id)->exists()) {
                continue;
            }
            $winner = $draws->draw($raffle);
            $this->info("{$raffle->title}: ticket #{$winner->number}");
        }

        return self::SUCCESS;
    }
}
