<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Support\PeriodoRelatorio;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class RelatorioSemanalController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->id_perfil, [1, 4, 5])) {
            return redirect()->route('chamados.index');
        }

        $periodo = PeriodoRelatorio::ciclo($request->input('inicio'));
        $filters = $this->resolverFiltros($request, $user);

        $baseVisivel = Chamado::visivelPara($user)->filtrar($filters);

        $novosIds = (clone $baseVisivel)
            ->novosNoPeriodo($periodo['inicio'], $periodo['fim'])
            ->pluck('id_chamado');

        $resolvidosIds = (clone $baseVisivel)
            ->resolvidosNoPeriodo($periodo['inicio'], $periodo['fim'])
            ->pluck('id_chamado');

        $idsPeriodo = $novosIds->merge($resolvidosIds)->unique()->values();

        $filtersBacklog = array_merge($filters, ['status' => 'todos']);
        $backlog = Chamado::visivelPara($user)
            ->filtrar($filtersBacklog)
            ->whereIn('st_status', [0, 1])
            ->count();

        $chamados = Chamado::whereIn('id_chamado', $idsPeriodo)
            ->with([
                'tipoChamado:id_tipo_chamado,ds_tipo_chamado',
                'empresa:id_empresa,ds_empresa',
                'tecnico',
                'historicosStatus' => function ($q) use ($periodo) {
                    $q->where('st_status', 9)
                        ->whereBetween('dt_update', [$periodo['inicio'], $periodo['fim']])
                        ->orderByDesc('dt_update');
                },
            ])
            ->orderByDesc('dt_data_chamado')
            ->get();

        $tabela = $chamados->map(function (Chamado $c) use ($novosIds) {
            $ehNovo = $novosIds->contains($c->id_chamado);
            $resolvidoEm = optional($c->historicosStatus->first())->dt_update;

            return [
                'id' => $c->id_chamado,
                'titulo' => $c->ds_titulo,
                'tipo' => $c->tipoChamado->ds_tipo_chamado ?? '-',
                'empresa' => $c->empresa->ds_empresa ?? '-',
                'tecnico' => $c->tecnico->ds_nome ?? 'Aguardando',
                'status' => match ((int) $c->st_status) {
                    0 => 'Aberto', 1 => 'Em Andamento', 9 => 'Resolvido', default => 'Outro',
                },
                'st_status' => (int) $c->st_status,
                'categoria' => $ehNovo ? 'Novo' : 'Resolvido',
                'data_referencia' => $ehNovo
                    ? Carbon::parse($c->dt_data_chamado)->format('d/m/Y H:i')
                    : ($resolvidoEm ? Carbon::parse($resolvidoEm)->format('d/m/Y H:i') : '-'),
            ];
        });

        return Inertia::render('Relatorios', [
            'periodo' => [
                'inicio' => $periodo['inicio']->toDateString(),
                'fim' => $periodo['fim']->copy()->subDay()->toDateString(),
            ],
            'kpis' => [
                'novos' => $novosIds->count(),
                'resolvidos' => $resolvidosIds->count(),
                'backlog' => $backlog,
            ],
            'tabela' => $tabela,
            'isVisaoGeral' => $user->id_perfil !== 4,
            'filters' => $filters,
        ]);
    }

    private function resolverFiltros(Request $request, $user): array
    {
        $filters = $request->only(['status', 'tecnico', 'tipo']);
        $filters['status'] = $filters['status'] ?? 'todos';
        $filters['tipo'] = $filters['tipo'] ?? 'todos';

        // Técnico (perfil 4) só pode ver os próprios chamados, ignorando
        // qualquer valor de "tecnico" vindo da query string.
        if ($user->id_perfil === 4) {
            $filters['tecnico'] = (string) $user->id_usuario;
        } else {
            $filters['tecnico'] = $filters['tecnico'] ?? 'todos';
        }

        return $filters;
    }
}
