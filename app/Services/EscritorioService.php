<?php

namespace App\Services;

use App\Models\Usuario;
use App\Support\StatusChamado;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Monta o "estado do escritório": quem está em cada baia, o que cada um tem
 * na fila, o que desenvolveu e fechou por último, e os números da equipe.
 *
 * A atribuição de resolvidos segue a mesma regra dos dashboards: chamado
 * vinculado ao técnico em rl_chamado_usuario + registro de status
 * Resolvido/Cancelado no histórico.
 */
class EscritorioService
{
    // Só conta atraso o que depende da equipe: Aguardando Teste e Pausado estão parados por
    // motivo de fora (usuário testando, peça), então não acendem alerta.
    const STATUS_QUE_ATRASAM = [StatusChamado::ABERTO, StatusChamado::EM_ANDAMENTO];

    const ARQUIVO_APARENCIAS = 'escritorio/aparencias.json';

    const CAMPOS_APARENCIA = [
        'pele', 'cabelo', 'corCabelo', 'barba', 'oculos', 'brinco', 'roupa', 'corRoupa', 'corpo',
    ];

    public function montar(): array
    {
        $agora = Carbon::now();
        $pessoas = $this->pessoas();
        $ids = $pessoas->pluck('id_usuario')->all();
        $idChefe = (int) config('escritorio.chefe');
        $horasAtraso = (int) config('escritorio.horas_atraso', 48);
        $limiteAtraso = $agora->copy()->subHours($horasAtraso);

        $pendentes = $this->pendentesPorTecnico($ids);
        $desenvolvendo = $this->desenvolvidosPorTecnico($ids, $agora);
        $resolvidos = $this->resolvidosPorTecnico($ids, $agora);
        $ultimaAtividade = $this->ultimaAtividade($ids, $agora);
        $aparencias = $this->aparencias();

        $seteDias = $agora->copy()->subDays(7);
        $inicioMes = $agora->copy()->startOfMonth();
        $hoje = $agora->copy()->startOfDay();
        $trintaDias = $agora->copy()->subDays(30);

        $lista = $pessoas->map(function ($u) use (
            $pendentes, $desenvolvendo, $resolvidos, $ultimaAtividade, $aparencias,
            $idChefe, $limiteAtraso, $hoje, $seteDias, $inicioMes, $trintaDias, $agora
        ) {
            $id = (int) $u->id_usuario;
            $fila = $pendentes->get($id, collect());
            $fechados = $resolvidos->get($id, collect());
            $doMes = $fechados->filter(fn ($c) => $c['resolvido_em_ts'] >= $trintaDias->timestamp);

            $emAndamento = $fila->where('status', StatusChamado::EM_ANDAMENTO)->sortByDesc('atualizado_em_ts')->first();
            $atrasados = $fila->filter(fn ($c) => in_array($c['status'], self::STATUS_QUE_ATRASAM) && $c['aberto_em_ts'] < $limiteAtraso->timestamp)->count();
            $ultima = $ultimaAtividade[$id] ?? null;

            return [
                'id' => $id,
                'nome' => trim($u->ds_nome),
                'apelido' => $this->apelido($u->ds_nome),
                'foto' => $u->ds_foto ? '/storage/' . $u->ds_foto : null,
                'chefe' => $id === $idChefe,
                'setor' => in_array($id, config('escritorio.infra', [])) ? 'infra' : 'dev',
                'fileira' => $this->fileiraDe($id),
                'aparencia' => $aparencias[$id] ?? (object) [],
                'contagem' => [
                    'fila' => $fila->count(),
                    'abertos' => $fila->where('status', StatusChamado::ABERTO)->count(),
                    'andamento' => $fila->where('status', StatusChamado::EM_ANDAMENTO)->count(),
                    'teste' => $fila->where('status', StatusChamado::AGUARDANDO_TESTE)->count(),
                    'pausados' => $fila->where('status', StatusChamado::PAUSADO)->count(),
                    'atrasados' => $atrasados,
                ],
                'resolvidos' => [
                    'hoje' => $fechados->filter(fn ($c) => $c['resolvido_em_ts'] >= $hoje->timestamp)->count(),
                    'sete_dias' => $fechados->filter(fn ($c) => $c['resolvido_em_ts'] >= $seteDias->timestamp)->count(),
                    'mes' => $fechados->filter(fn ($c) => $c['resolvido_em_ts'] >= $inicioMes->timestamp)->count(),
                ],
                'tempo_medio_horas' => $doMes->count()
                    ? round($doMes->avg(fn ($c) => ($c['resolvido_em_ts'] - $c['aberto_em_ts']) / 3600), 1)
                    : null,
                'atual' => $emAndamento ? $this->semTimestamps($emAndamento) : null,
                'ultima_atividade' => $ultima?->toIso8601String(),
                'ativo_recente' => $ultima && $ultima->gt($agora->copy()->subMinutes(45)),
                'fila' => $fila->map(fn ($c) => $this->semTimestamps($c))->values(),
                'desenvolvendo' => $desenvolvendo->get($id, collect())->map(fn ($c) => $this->semTimestamps($c))->values(),
                'fechados' => $fechados->take(12)->map(fn ($c) => $this->semTimestamps($c))->values(),
            ];
        })->values();

        $ranking = $lista->where('chefe', false)
            ->filter(fn ($p) => $p['resolvidos']['sete_dias'] > 0)
            ->sortByDesc(fn ($p) => $p['resolvidos']['sete_dias'])
            ->map(fn ($p) => ['id' => $p['id'], 'nome' => $p['apelido'], 'total' => $p['resolvidos']['sete_dias']])
            ->values();

        return [
            'agora' => $agora->toIso8601String(),
            'expediente' => $this->emExpediente($agora),
            'kpis' => $this->kpis($agora, $limiteAtraso),
            'pessoas' => $lista,
            'triagem' => $this->triagem(),
            'atrasados' => $this->atrasadosGerais($limiteAtraso),
            'ranking_sete_dias' => $ranking,
            'eventos' => $this->eventos($agora),
            'ultimos_fechados' => $this->ultimosPorStatus([StatusChamado::RESOLVIDO], $agora),
            'ultimos_em_andamento' => $this->ultimosPorStatus([StatusChamado::EM_ANDAMENTO], $agora),
            'chat' =>$this->chatRecente($agora),
            'config' => [
                'atualizar_a_cada_segundos' => (int) config('escritorio.atualizar_a_cada_segundos', 30),
                'fila_sobrecarga' => (int) config('escritorio.fila_sobrecarga', 5),
                'horas_atraso' => $horasAtraso,
            ],
        ];
    }

    /**
     * Grava a aparência de uma pessoa por cima do padrão do config.
     */
    public function salvarAparencia(int $idUsuario, array $dados): array
    {
        $salvas = $this->aparenciasSalvas();
        $salvas[$idUsuario] = array_intersect_key($dados, array_flip(self::CAMPOS_APARENCIA));
        Storage::disk('local')->put(self::ARQUIVO_APARENCIAS, json_encode($salvas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $this->aparencias()[$idUsuario] ?? [];
    }

    // ------------------------------------------------------------------

    private function pessoas(): Collection
    {
        $idChefe = (int) config('escritorio.chefe');

        return Usuario::query()
            ->where('st_ativo', 'A')
            ->where(function ($q) use ($idChefe) {
                $q->whereIn('id_perfil', config('escritorio.perfis_com_baia', [4]))
                    ->orWhereIn('id_usuario', config('escritorio.incluir', []))
                    ->orWhere('id_usuario', $idChefe);
            })
            ->whereNotIn('id_usuario', config('escritorio.ocultar', []))
            ->orderBy('ds_nome')
            ->get(['id_usuario', 'ds_nome', 'ds_foto', 'id_perfil']);
    }

    private function aparencias(): array
    {
        $padrao = config('escritorio.aparencias', []);
        $salvas = $this->aparenciasSalvas();
        $todas = [];
        foreach (array_unique(array_merge(array_keys($padrao), array_keys($salvas))) as $id) {
            $todas[(int) $id] = array_merge($padrao[$id] ?? [], $salvas[$id] ?? []);
        }

        return $todas;
    }

    private function aparenciasSalvas(): array
    {
        $disco = Storage::disk('local');
        if (!$disco->exists(self::ARQUIVO_APARENCIAS)) {
            return [];
        }

        return json_decode($disco->get(self::ARQUIVO_APARENCIAS), true) ?: [];
    }

    /**
     * Consulta base de chamado com os dados que o painel mostra.
     */
    private function baseChamados()
    {
        return DB::table('tb_chamados as c')
            ->leftJoin('tb_empresa as e', 'c.id_empresa', '=', 'e.id_empresa')
            ->leftJoin('tb_localizacao as l', 'c.id_localizacao', '=', 'l.id_localizacao')
            ->leftJoin('tb_usuario_laravel as s', 'c.id_usuario', '=', 's.id_usuario')
            ->select(
                'c.id_chamado', 'c.ds_titulo', 'c.st_status', 'c.st_grau', 'c.dt_data_chamado',
                'c.dt_update', 'c.dt_previsao_termino',
                'e.ds_empresa', 'l.ds_localizacao', 's.ds_nome as ds_solicitante'
            );
    }

    private function formatarChamado($c, array $extra = []): array
    {
        $aberto = Carbon::parse($c->dt_data_chamado);
        $atualizado = $c->dt_update ? Carbon::parse($c->dt_update) : $aberto;

        return array_merge([
            'id' => (int) $c->id_chamado,
            'titulo' => $c->ds_titulo,
            'status' => (int) $c->st_status,
            'status_label' => StatusChamado::label((int) $c->st_status),
            'cor' => StatusChamado::color((int) $c->st_status),
            'grau' => $this->grau($c->st_grau),
            'empresa' => $c->ds_empresa,
            'localizacao' => $c->ds_localizacao,
            'solicitante' => $c->ds_solicitante ? $this->apelido($c->ds_solicitante, 2) : null,
            'aberto_em' => $aberto->toIso8601String(),
            'aberto_em_ts' => $aberto->timestamp,
            'atualizado_em' => $atualizado->toIso8601String(),
            'atualizado_em_ts' => $atualizado->timestamp,
            'previsao' => $c->dt_previsao_termino ? Carbon::parse($c->dt_previsao_termino)->toIso8601String() : null,
        ], $extra);
    }

    private function semTimestamps(array $c): array
    {
        return array_diff_key($c, array_flip(['aberto_em_ts', 'atualizado_em_ts', 'resolvido_em_ts']));
    }

    private function pendentesPorTecnico(array $ids): Collection
    {
        return $this->baseChamados()
            ->join('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->addSelect('rl.id_usuario as id_tecnico', 'rl.ordem_fila')
            ->whereIn('rl.id_usuario', $ids)
            ->whereIn('c.st_status', StatusChamado::GRUPO_PENDENTE)
            ->orderByRaw('rl.ordem_fila IS NULL, rl.ordem_fila')
            ->orderBy('c.dt_data_chamado')
            ->get()
            ->groupBy('id_tecnico')
            ->map(fn ($grupo) => $grupo->map(fn ($c) => $this->formatarChamado($c))->values());
    }

    /**
     * Últimos chamados que cada um colocou "Em Andamento" (30 dias), com o
     * status de agora — mostra no que a pessoa vem trabalhando.
     */
    private function desenvolvidosPorTecnico(array $ids, Carbon $agora): Collection
    {
        $linhas = $this->baseChamados()
            ->join('tb_historico_status_chamado as h', 'h.id_chamado', '=', 'c.id_chamado')
            ->addSelect('h.id_usuario as id_tecnico', 'h.dt_update as dt_inicio')
            ->whereIn('h.id_usuario', $ids)
            ->where('h.st_status', StatusChamado::EM_ANDAMENTO)
            ->where('h.dt_update', '>=', $agora->copy()->subDays(30))
            ->orderByDesc('h.dt_update')
            ->get();

        return $linhas->groupBy('id_tecnico')->map(function ($grupo) {
            return $grupo->unique('id_chamado')->take(10)->map(fn ($c) => $this->formatarChamado($c, [
                'iniciado_em' => Carbon::parse($c->dt_inicio)->toIso8601String(),
            ]))->values();
        });
    }

    private function resolvidosPorTecnico(array $ids, Carbon $agora): Collection
    {
        $linhas = $this->baseChamados()
            ->join('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->join('tb_historico_status_chamado as h', 'h.id_chamado', '=', 'c.id_chamado')
            ->addSelect('rl.id_usuario as id_tecnico', 'h.dt_update as dt_resolvido', 'h.st_status as st_resolvido')
            ->whereIn('rl.id_usuario', $ids)
            ->whereIn('h.st_status', StatusChamado::GRUPO_RESOLVIDO)
            ->whereIn('c.st_status', StatusChamado::GRUPO_RESOLVIDO)
            ->where('h.dt_update', '>=', $agora->copy()->subDays(45))
            ->orderByDesc('h.dt_update')
            ->get();

        return $linhas->groupBy('id_tecnico')->map(function ($grupo) {
            return $grupo->unique('id_chamado')->map(function ($c) {
                $resolvido = Carbon::parse($c->dt_resolvido);

                return $this->formatarChamado($c, [
                    'resolvido_em' => $resolvido->toIso8601String(),
                    'resolvido_em_ts' => $resolvido->timestamp,
                    'duracao_horas' => round(($resolvido->timestamp - Carbon::parse($c->dt_data_chamado)->timestamp) / 3600, 1),
                ]);
            })->values();
        });
    }

    /**
     * Último sinal de vida de cada um: mudança de status ou mensagem no chat
     * da equipe. Não é presença real, só "mexeu no sistema há pouco".
     */
    private function ultimaAtividade(array $ids, Carbon $agora): array
    {
        $desde = $agora->copy()->subDays(7);
        $status = DB::table('tb_historico_status_chamado')
            ->whereIn('id_usuario', $ids)->where('dt_update', '>=', $desde)
            ->groupBy('id_usuario')->select('id_usuario', DB::raw('MAX(dt_update) as ultima'))
            ->pluck('ultima', 'id_usuario');
        $chat = DB::table('tb_chat_tecnico')
            ->whereIn('id_usuario', $ids)->where('dt_envio', '>=', $desde)
            ->groupBy('id_usuario')->select('id_usuario', DB::raw('MAX(dt_envio) as ultima'))
            ->pluck('ultima', 'id_usuario');

        $resultado = [];
        foreach ($ids as $id) {
            $datas = array_filter([$status[$id] ?? null, $chat[$id] ?? null]);
            if ($datas) {
                $resultado[$id] = Carbon::parse(max($datas));
            }
        }

        return $resultado;
    }

    private function kpis(Carbon $agora, Carbon $limiteAtraso): array
    {
        $porStatus = DB::table('tb_chamados')
            ->whereIn('st_status', StatusChamado::GRUPO_PENDENTE)
            ->groupBy('st_status')
            ->select('st_status', DB::raw('COUNT(*) as n'))
            ->pluck('n', 'st_status');

        $resolvidosHoje = DB::table('tb_historico_status_chamado')
            ->whereIn('st_status', StatusChamado::GRUPO_RESOLVIDO)
            ->where('dt_update', '>=', $agora->copy()->startOfDay())
            ->distinct()->count('id_chamado');

        return [
            'abertos' => (int) ($porStatus[StatusChamado::ABERTO] ?? 0),
            'sem_responsavel' => DB::table('tb_chamados as c')
                ->where('c.st_status', StatusChamado::ABERTO)
                ->whereNotExists(fn ($q) => $q->from('rl_chamado_usuario as rl')->whereColumn('rl.id_chamado', 'c.id_chamado'))
                ->count(),
            'em_andamento' => (int) ($porStatus[StatusChamado::EM_ANDAMENTO] ?? 0),
            'aguardando_teste' => (int) ($porStatus[StatusChamado::AGUARDANDO_TESTE] ?? 0),
            'pausados' => (int) ($porStatus[StatusChamado::PAUSADO] ?? 0),
            'atrasados' => DB::table('tb_chamados')
                ->whereIn('st_status', self::STATUS_QUE_ATRASAM)
                ->where('dt_data_chamado', '<', $limiteAtraso)
                ->count(),
            'abertos_hoje' => DB::table('tb_chamados')->where('dt_data_chamado', '>=', $agora->copy()->startOfDay())->count(),
            'resolvidos_hoje' => $resolvidosHoje,
        ];
    }

    /**
     * Chamados abertos que ninguém pegou ainda: a pilha da mesa de triagem.
     */
    private function triagem(): array
    {
        return $this->baseChamados()
            ->where('c.st_status', StatusChamado::ABERTO)
            ->whereNotExists(fn ($q) => $q->from('rl_chamado_usuario as rl')->whereColumn('rl.id_chamado', 'c.id_chamado'))
            ->orderBy('c.dt_data_chamado')
            ->limit(20)
            ->get()
            ->map(fn ($c) => $this->semTimestamps($this->formatarChamado($c)))
            ->all();
    }

    private function atrasadosGerais(Carbon $limiteAtraso): array
    {
        return $this->baseChamados()
            ->leftJoin('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->leftJoin('tb_usuario_laravel as t', 'rl.id_usuario', '=', 't.id_usuario')
            ->addSelect('t.id_usuario as id_tecnico', 't.ds_nome as ds_tecnico')
            ->whereIn('c.st_status', self::STATUS_QUE_ATRASAM)
            ->where('c.dt_data_chamado', '<', $limiteAtraso)
            ->orderBy('c.dt_data_chamado')
            ->limit(30)
            ->get()
            ->map(fn ($c) => $this->semTimestamps($this->formatarChamado($c, [
                'id_tecnico' => $c->id_tecnico ? (int) $c->id_tecnico : null,
                'tecnico' => $c->ds_tecnico ? $this->apelido($c->ds_tecnico) : null,
            ])))
            ->all();
    }

    /**
     * Últimas mudanças de status (7 dias): painel de movimento e comemorações.
     */
    private function eventos(Carbon $agora): array
    {
        return DB::table('tb_historico_status_chamado as h')
            ->join('tb_chamados as c', 'c.id_chamado', '=', 'h.id_chamado')
            ->leftJoin('tb_usuario_laravel as u', 'u.id_usuario', '=', 'h.id_usuario')
            ->where('h.dt_update', '>=', $agora->copy()->subDays(7))
            ->orderByDesc('h.dt_update')
            ->orderByDesc('h.id_historico')
            ->limit(40)
            ->get(['h.id_historico', 'h.id_chamado', 'h.st_status', 'h.id_usuario', 'h.dt_update', 'c.ds_titulo', 'u.ds_nome'])
            ->map(fn ($h) => [
                'id' => (int) $h->id_historico,
                'id_chamado' => (int) $h->id_chamado,
                'titulo' => $h->ds_titulo,
                'status' => (int) $h->st_status,
                'status_label' => StatusChamado::label((int) $h->st_status),
                'cor' => StatusChamado::color((int) $h->st_status),
                'id_usuario' => $h->id_usuario ? (int) $h->id_usuario : null,
                'quem' => $h->ds_nome ? $this->apelido($h->ds_nome) : 'Sistema',
                'quando' => Carbon::parse($h->dt_update)->toIso8601String(),
            ])
            ->all();
    }

    /**
     * Últimos chamados da equipe que entraram num status (ex.: Resolvido, Em
     * Andamento), um por chamado, com quem fez a mudança e o status de agora.
     */
    private function ultimosPorStatus(array $status, Carbon $agora): array
    {
        return $this->baseChamados()
            ->join('tb_historico_status_chamado as h', 'h.id_chamado', '=', 'c.id_chamado')
            ->leftJoin('tb_usuario_laravel as q', 'q.id_usuario', '=', 'h.id_usuario')
            ->addSelect('h.id_usuario as id_quem', 'q.ds_nome as ds_quem', 'h.dt_update as dt_mudanca')
            ->whereIn('h.st_status', $status)
            ->where('h.dt_update', '>=', $agora->copy()->subDays(30))
            ->orderByDesc('h.dt_update')
            ->limit(60)
            ->get()
            ->unique('id_chamado')
            ->take(15)
            ->map(fn ($c) => $this->semTimestamps($this->formatarChamado($c, [
                'id_quem' => $c->id_quem ? (int) $c->id_quem : null,
                'quem' => $c->ds_quem ? $this->apelido($c->ds_quem) : 'Sistema',
                'quando' => Carbon::parse($c->dt_mudanca)->toIso8601String(),
            ])))
            ->values()
            ->all();
    }

    /**
     * Mensagens do chat da equipe dos últimos 15 minutos: viram balões em cima das cabeças.
     */
    private function chatRecente(Carbon $agora): array
    {
        return DB::table('tb_chat_tecnico')
            ->where('dt_envio', '>=', $agora->copy()->subMinutes(15))
            ->orderByDesc('dt_envio')
            ->limit(12)
            ->get(['id', 'id_usuario', 'ds_mensagem', 'ds_caminho_arquivo', 'dt_envio'])
            ->map(fn ($m) => [
                'id' => (int) $m->id,
                'id_usuario' => (int) $m->id_usuario,
                'texto' => $m->ds_mensagem ? mb_strimwidth(strip_tags($m->ds_mensagem), 0, 90, '…') : '📎 enviou um arquivo',
                'quando' => Carbon::parse($m->dt_envio)->toIso8601String(),
            ])
            ->all();
    }

    // Índice da fileira fixada em escritorio.fileiras (0 = fundo), ou null para distribuir sozinho.
    private function fileiraDe(int $id): ?int
    {
        foreach (config('escritorio.fileiras', []) as $indice => $ids) {
            if (in_array($id, $ids)) {
                return (int) $indice;
            }
        }

        return null;
    }

    private function emExpediente(Carbon $agora): bool
    {
        return $agora->isWeekday() && $agora->hour >= 8 && $agora->hour < 18;
    }

    private function grau($grau): ?string
    {
        return [1 => 'Melhoria', 2 => 'Problema', 3 => 'Cadastro de Paciente', 4 => 'Relatório'][(int) $grau] ?? null;
    }

    private function apelido(string $nome, int $palavras = 1): string
    {
        $partes = preg_split('/\s+/', trim($nome));

        return mb_convert_case(implode(' ', array_slice($partes, 0, $palavras)), MB_CASE_TITLE);
    }
}
