<?php

namespace Tests\Unit;

use App\Support\PeriodoRelatorio;
use Carbon\Carbon;
use Tests\TestCase;

class PeriodoRelatorioTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_ciclo_padrao_quando_hoje_e_terca(): void
    {
        $terca = Carbon::now()->next(Carbon::TUESDAY)->startOfDay();
        Carbon::setTestNow($terca);

        $periodo = PeriodoRelatorio::ciclo();

        $this->assertTrue($periodo['inicio']->equalTo($terca->copy()->subDays(7)));
        $this->assertTrue($periodo['fim']->equalTo($terca));
    }

    public function test_ciclo_padrao_no_meio_da_semana(): void
    {
        $terca = Carbon::now()->next(Carbon::TUESDAY)->startOfDay();
        $quarta = $terca->copy()->addDay(); // um dia depois da terça
        Carbon::setTestNow($quarta);

        $periodo = PeriodoRelatorio::ciclo();

        $this->assertTrue($periodo['inicio']->equalTo($terca));
        $this->assertTrue($periodo['fim']->equalTo($terca->copy()->addDays(7)));
    }

    public function test_ciclo_padrao_no_ultimo_dia_do_ciclo(): void
    {
        $terca = Carbon::now()->next(Carbon::TUESDAY)->startOfDay();
        $segundaSeguinte = $terca->copy()->addDays(6); // último dia antes da próxima terça
        Carbon::setTestNow($segundaSeguinte);

        $periodo = PeriodoRelatorio::ciclo();

        $this->assertTrue($periodo['inicio']->equalTo($terca));
        $this->assertTrue($periodo['fim']->equalTo($terca->copy()->addDays(7)));
    }

    public function test_ciclo_a_partir_de_inicio_explicito(): void
    {
        $periodo = PeriodoRelatorio::ciclo('2026-08-18');

        $this->assertSame('2026-08-18 00:00:00', $periodo['inicio']->toDateTimeString());
        $this->assertSame('2026-08-25 00:00:00', $periodo['fim']->toDateTimeString());
    }
}
