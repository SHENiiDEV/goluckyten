<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('raffles:auto-draw')->everyMinute()->withoutOverlapping();
Schedule::command('raffles:remind')->everyFifteenMinutes();
