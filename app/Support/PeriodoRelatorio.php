<?php

namespace App\Support;

use Carbon\Carbon;

class PeriodoRelatorio
{
    /**
     * Calcula o ciclo terça-a-terça.
     * Se $inicio não for informado, calcula o ciclo "atual": a terça-feira
     * mais recente (estritamente anterior a hoje) até a próxima terça-feira.
     * Isso garante que, ao abrir o relatório numa terça (dia da reunião),
     * o ciclo mostrado seja exatamente a semana que acabou de se encerrar.
     *
     * @return array{inicio: Carbon, fim: Carbon}
     */
    public static function ciclo(?string $inicio = null): array
    {
        $dataInicio = $inicio
            ? Carbon::parse($inicio)->startOfDay()
            : Carbon::today()->previous(Carbon::TUESDAY);

        return [
            'inicio' => $dataInicio,
            'fim' => $dataInicio->copy()->addDays(7),
        ];
    }
}
