<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Support\PeriodoRelatorio;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RelatorioSemanalController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->id_perfil, [1, 4, 5])) {
            return redirect()->route('chamados.index');
        }

        $dados = $this->montarRelatorio($request, $user);

        $tecnicos = $user->id_perfil === 4
            ? []
            : \App\Models\User::where('id_perfil', 4)->where('st_ativo', 'A')
                ->orderBy('ds_nome')->get(['id_usuario', 'ds_nome']);

        $tipos = \App\Models\TipoChamado::where('st_ativo', 'A')
            ->orderBy('ds_tipo_chamado')->get(['id_tipo_chamado', 'ds_tipo_chamado']);

        return Inertia::render('Relatorios', [
            'periodo' => [
                'inicio' => $dados['periodo']['inicio']->toDateString(),
                'fim' => $dados['periodo']['fim']->copy()->subDay()->toDateString(),
            ],
            'kpis' => $dados['kpis'],
            'tabela' => $dados['tabela'],
            'cargaPorTecnico' => $dados['cargaPorTecnico'],
            'isVisaoGeral' => $user->id_perfil !== 4,
            'filters' => $dados['filters'],
            'tecnicos' => $tecnicos,
            'tipos' => $tipos,
            'modo' => $request->input('modo') === 'personalizado' ? 'personalizado' : 'ciclo',
        ]);
    }

    public function export(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->id_perfil, [1, 4, 5])) {
            abort(403);
        }

        $dados = $this->montarRelatorio($request, $user);
        $nomeArquivo = 'relatorio-semanal-' . $dados['periodo']['inicio']->format('Y-m-d');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('relatorios.pdf', [
            'linhas' => $dados['tabela'],
            'periodoInicio' => $dados['periodo']['inicio']->format('d/m/Y'),
            'periodoFim' => $dados['periodo']['fim']->copy()->subDay()->format('d/m/Y'),
        ]);

        return $pdf->download("{$nomeArquivo}.pdf");
    }

    private function montarRelatorio(Request $request, $user): array
    {
        if ($request->input('modo') === 'personalizado' && $request->filled(['data_inicio', 'data_fim'])) {
            $inicio = Carbon::parse($request->input('data_inicio'))->startOfDay();
            $fim = Carbon::parse($request->input('data_fim'))->addDay()->startOfDay();
            $periodo = ['inicio' => $inicio, 'fim' => $fim];
        } else {
            $periodo = PeriodoRelatorio::ciclo($request->input('inicio'));
        }

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

        $kpis = [
            'novos' => $novosIds->count(),
            'resolvidos' => $resolvidosIds->count(),
            'backlog' => $backlog,
        ];

        $cargaPorTecnico = [];
        if ($user->id_perfil !== 4) {
            $filtersCarga = array_merge($filters, ['status' => 'todos']);
            $cargaPorTecnico = DB::table('rl_chamado_usuario')
                ->joinSub(
                    Chamado::visivelPara($user)->filtrar($filtersCarga)->whereIn('tb_chamados.st_status', [0, 1]),
                    'c',
                    fn ($join) => $join->on('rl_chamado_usuario.id_chamado', '=', 'c.id_chamado')
                )
                ->join('tb_usuario_laravel as u', 'rl_chamado_usuario.id_usuario', '=', 'u.id_usuario')
                ->select('u.ds_nome as name', DB::raw('count(*) as value'))
                ->groupBy('u.ds_nome')
                ->orderByDesc('value')
                ->get();
        }

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
                'categoria' => $ehNovo ? 'Aberto no período' : 'Resolvido no período',
                'data_referencia' => $ehNovo
                    ? Carbon::parse($c->dt_data_chamado)->format('d/m/Y H:i')
                    : ($resolvidoEm ? Carbon::parse($resolvidoEm)->format('d/m/Y H:i') : '-'),
            ];
        });

        return compact('periodo', 'filters', 'kpis', 'tabela', 'cargaPorTecnico');
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
