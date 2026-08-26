<?php

namespace App\Support;

class StatusChamado
{
    const ABERTO = 0;
    const EM_ANDAMENTO = 1;
    const AGUARDANDO_TESTE = 2;
    const PAUSADO = 3;
    const CANCELADO = 8;
    const RESOLVIDO = 9;

    /**
     * Todos os status, na ordem em que devem aparecer em listas/filtros.
     */
    const LABELS = [
        self::ABERTO => 'Aberto',
        self::EM_ANDAMENTO => 'Em Andamento',
        self::AGUARDANDO_TESTE => 'Aguardando Teste do Usuário',
        self::PAUSADO => 'Pausado/Aguardando Peça',
        self::CANCELADO => 'Cancelado',
        self::RESOLVIDO => 'Resolvido',
    ];

    /**
     * Os 3 status principais (90% dos casos) — usados no quadro Kanban e como
     * ações primárias de mudança de status. Os demais ficam disponíveis, mas
     * separados, em vez de disputar espaço com esses três.
     */
    const PRINCIPAIS = [self::ABERTO, self::EM_ANDAMENTO, self::RESOLVIDO];

    /**
     * Status "secundários": existem, mas não aparecem no Kanban nem como
     * botão principal — só via um seletor à parte.
     */
    const SECUNDARIOS = [self::AGUARDANDO_TESTE, self::PAUSADO, self::CANCELADO];

    /**
     * Para fins de contagem/KPI (dashboards e relatório semanal), Aguardando
     * Teste e Pausado somam junto com Em Andamento (ainda é trabalho pendente,
     * só que bloqueado), e Cancelado soma junto com Resolvido (não é mais
     * atendimento em aberto). Aberto continua sozinho.
     */
    const GRUPO_ABERTO = [self::ABERTO];
    const GRUPO_EM_ANDAMENTO = [self::EM_ANDAMENTO, self::AGUARDANDO_TESTE, self::PAUSADO];
    const GRUPO_RESOLVIDO = [self::CANCELADO, self::RESOLVIDO];

    /**
     * "Ainda pendente" = tudo que não é Resolvido/Cancelado. Usado em
     * backlog, atrasados/SLA e cargas de trabalho.
     */
    const GRUPO_PENDENTE = [self::ABERTO, self::EM_ANDAMENTO, self::AGUARDANDO_TESTE, self::PAUSADO];

    public static function label(?int $status): string
    {
        return self::LABELS[$status] ?? 'Outro';
    }

    /**
     * Classe de cor Tailwind (sem "bg-"/"text-" prefixados) usada em vários
     * lugares do backend que geram HTML/labels com cor (ex: pizza do
     * DashboardAdmin). Mantém as cores dos 3 principais e dá cores próprias
     * às novas.
     */
    public static function color(?int $status): string
    {
        return match ($status) {
            self::ABERTO => '#3b82f6',       // azul
            self::EM_ANDAMENTO => '#f59e0b', // âmbar
            self::AGUARDANDO_TESTE => '#a855f7', // roxo
            self::PAUSADO => '#f97316',      // laranja
            self::CANCELADO => '#94a3b8',    // cinza
            self::RESOLVIDO => '#10b981',    // verde
            default => '#64748b',
        };
    }
}
