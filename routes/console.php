<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Lembretes de prazo dos chamados (vence hoje / atrasados): seg–sex às 8h.
// Precisa do cron do servidor chamando `php artisan schedule:run` a cada minuto.
Schedule::command('chamados:lembrar-prazos')
    ->weekdays()
    ->at('08:00')
    ->withoutOverlapping();
