<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Regras do prazo de entrega do chamado — fonte única de verdade, no mesmo
 * espírito de StatusChamado. Espelhada no frontend em
 * resources/js/lib/prazoChamado.js: qualquer mudança aqui precisa ser feita
 * nos dois lugares.
 *
 * O prazo é só uma data: o chamado vence no fim desse dia.
 */
class PrazoChamado
{
    // Situações possíveis do prazo de um chamado.
    const A_DEFINIR = 'a_definir';   // Aberto: ninguém assumiu ainda
    const SEM_PRAZO = 'sem_prazo';   // pendente, mas sem prazo (chamados de antes do prazo existir)
    const NO_PRAZO = 'no_prazo';
    const VENCE_HOJE = 'vence_hoje';
    const ATRASADO = 'atrasado';
    const ENCERRADO = 'encerrado';   // Resolvido ou Cancelado

    /**
     * Status em que o chamado está com um técnico e o prazo corre.
     */
    const STATUS_COM_PRAZO = [
        StatusChamado::EM_ANDAMENTO,
        StatusChamado::AGUARDANDO_TESTE,
        StatusChamado::PAUSADO,
    ];

    const MIN_JUSTIFICATIVA = 10;

    /**
     * A mudança de status coloca o chamado nas mãos de um técnico (assumir um
     * Aberto ou reabrir um Resolvido/Cancelado direto para um status
     * pendente)? Então o prazo de entrega é obrigatório.
     */
    public static function exigePrazo(int $de, int $para): bool
    {
        return in_array($para, self::STATUS_COM_PRAZO, true)
            && !in_array($de, self::STATUS_COM_PRAZO, true);
    }

    public static function situacao(CarbonInterface|string|null $prazo, int $status, ?CarbonInterface $hoje = null): string
    {
        if (in_array($status, StatusChamado::GRUPO_RESOLVIDO, true)) {
            return self::ENCERRADO;
        }

        if ($status === StatusChamado::ABERTO) {
            return self::A_DEFINIR;
        }

        $dias = self::diasAteOPrazo($prazo, $hoje);

        if ($dias === null) {
            return self::SEM_PRAZO;
        }

        if ($dias < 0) {
            return self::ATRASADO;
        }

        return $dias === 0 ? self::VENCE_HOJE : self::NO_PRAZO;
    }

    /**
     * Dias de calendário entre hoje e o prazo (negativo = atrasado).
     */
    public static function diasAteOPrazo(CarbonInterface|string|null $prazo, ?CarbonInterface $hoje = null): ?int
    {
        $data = self::data($prazo);
        if (!$data) {
            return null;
        }

        $hoje = ($hoje ? Carbon::instance($hoje) : Carbon::now())->copy()->startOfDay();

        // round(): no Carbon 3 a diferença vem como float.
        return (int) round($hoje->diffInDays($data, false));
    }

    /**
     * "vence hoje", "vence amanhã", "vence em 5 dias", "atrasado há 3 dias".
     * Vazio quando não há contagem a mostrar (sem prazo, aberto, encerrado).
     */
    public static function descricao(CarbonInterface|string|null $prazo, int $status, ?CarbonInterface $hoje = null): string
    {
        $situacao = self::situacao($prazo, $status, $hoje);

        if (!in_array($situacao, [self::NO_PRAZO, self::VENCE_HOJE, self::ATRASADO], true)) {
            return '';
        }

        $dias = self::diasAteOPrazo($prazo, $hoje);

        if ($dias === 0) {
            return 'vence hoje';
        }
        if ($dias === 1) {
            return 'vence amanhã';
        }
        if ($dias > 1) {
            return "vence em {$dias} dias";
        }

        $atraso = abs($dias);

        return $atraso === 1 ? 'atrasado há 1 dia' : "atrasado há {$atraso} dias";
    }

    /**
     * Texto do prazo para mensagens (WhatsApp, e-mail, notificações):
     * "16/11/2026 (vence em 5 dias)".
     */
    public static function texto(CarbonInterface|string|null $prazo, int $status, ?CarbonInterface $hoje = null): string
    {
        $situacao = self::situacao($prazo, $status, $hoje);

        if ($situacao === self::A_DEFINIR) {
            return 'a definir quando um técnico assumir';
        }

        $data = self::data($prazo);
        if (!$data) {
            return 'não definido';
        }

        $descricao = self::descricao($prazo, $status, $hoje);

        return $descricao ? $data->format('d/m/Y') . " ({$descricao})" : $data->format('d/m/Y');
    }

    /**
     * Linha padrão de prazo que entra em todas as mensagens de WhatsApp.
     */
    public static function linhaWhatsApp(CarbonInterface|string|null $prazo, int $status): string
    {
        return '📅 *Prazo:* ' . self::texto($prazo, $status);
    }

    /**
     * Quem recebe o lembrete diário, conforme o status e a situação do prazo.
     *
     *                      Vence hoje        Atrasado
     *   Em Andamento       técnico + dono    técnico
     *   Pausado/Ag. teste  dono              dono
     */
    public static function destinatarios(int $status, string $situacao): array
    {
        if (!in_array($situacao, [self::VENCE_HOJE, self::ATRASADO], true)) {
            return [];
        }

        if ($status === StatusChamado::EM_ANDAMENTO) {
            return $situacao === self::VENCE_HOJE ? ['tecnico', 'dono'] : ['tecnico'];
        }

        if (in_array($status, [StatusChamado::PAUSADO, StatusChamado::AGUARDANDO_TESTE], true)) {
            return ['dono'];
        }

        return [];
    }

    /**
     * Normaliza o prazo (Carbon, "Y-m-d" ou "Y-m-d H:i:s") para o início do dia.
     */
    public static function data(CarbonInterface|string|null $prazo): ?Carbon
    {
        if ($prazo === null || $prazo === '') {
            return null;
        }

        $data = $prazo instanceof CarbonInterface
            ? Carbon::instance($prazo)->copy()
            : Carbon::parse(substr((string) $prazo, 0, 10));

        return $data->startOfDay();
    }
}
