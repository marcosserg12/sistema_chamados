<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Chamado;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardTecnicoController extends Controller
{
    private function formatarTempoAberto($dataCriacao) {
        $dataInicial = Carbon::parse($dataCriacao);
        $agora = Carbon::now();
        $diff = $dataInicial->diff($agora);
        return "{$diff->days}d {$diff->h}h";
    }

    public function index()
    {
        $user = auth()->user();
        $id_usuario = $user->id_usuario;

        // Verificar permissão
        if (!in_array($user->id_perfil, [1, 4, 5])) {
            return redirect()->route('dashboard');
        }

        // 1. Minhas KPIs
        $meusAtivos = DB::table('rl_chamado_usuario')
            ->join('tb_chamados', 'rl_chamado_usuario.id_chamado', '=', 'tb_chamados.id_chamado')
            ->where('rl_chamado_usuario.id_usuario', $id_usuario)
            ->whereIn('tb_chamados.st_status', [0, 1])
            ->count();

        $meusResolvidos = DB::table('rl_chamado_usuario')
            ->join('tb_chamados', 'rl_chamado_usuario.id_chamado', '=', 'tb_chamados.id_chamado')
            ->where('rl_chamado_usuario.id_usuario', $id_usuario)
            ->where('tb_chamados.st_status', 9)
            ->count();

        $meusAtrasados = DB::table('rl_chamado_usuario')
            ->join('tb_chamados', 'rl_chamado_usuario.id_chamado', '=', 'tb_chamados.id_chamado')
            ->where('rl_chamado_usuario.id_usuario', $id_usuario)
            ->whereIn('tb_chamados.st_status', [0, 1])
            ->where('tb_chamados.dt_data_chamado', '<', Carbon::now()->subHours(48))
            ->count();

        // 2. Meus Gráficos
        
        // Tendência (Meus atendimentos nos últimos 14 dias)
        $dailyTrend = DB::table('rl_chamado_usuario')
            ->join('tb_chamados', 'rl_chamado_usuario.id_chamado', '=', 'tb_chamados.id_chamado')
            ->where('rl_chamado_usuario.id_usuario', $id_usuario)
            ->where('tb_chamados.dt_data_chamado', '>=', Carbon::now()->subDays(14))
            ->select(DB::raw('DATE(dt_data_chamado) as date'), DB::raw('count(*) as chamados'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => Carbon::parse($item->date)->format('d/m'),
                'chamados' => $item->chamados
            ]);

        // Produtividade Diária do Mês Atual (Linha)
        $mesAtualPerformance = [];
        $inicioMes = Carbon::now()->startOfMonth();
        $hoje = Carbon::now();
        
        for ($date = clone $inicioMes; $date->lte($hoje); $date->addDay()) {
            $dataStr = $date->format('Y-m-d');
            $resolvidosCount = DB::table('tb_historico_status_chamado as h')
                ->join('rl_chamado_usuario as rl', 'h.id_chamado', '=', 'rl.id_chamado')
                ->where('rl.id_usuario', $id_usuario)
                ->where('h.st_status', 9)
                ->whereDate('h.dt_update', $dataStr)
                ->count();

            $mesAtualPerformance[] = [
                'dia' => $date->format('d/m'),
                'resolvidos' => $resolvidosCount
            ];
        }

        // 3. Minha Fila de Trabalho (Top 10 ativos)
        $minhasTarefas = Chamado::from('tb_chamados as c')
            ->join('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->leftJoin('tb_empresa as e', 'c.id_empresa', '=', 'e.id_empresa')
            ->leftJoin('tb_motivo_associado as ma', 'c.id_motivo_associado', '=', 'ma.id_motivo_associado')
            ->where('rl.id_usuario', $id_usuario)
            ->whereIn('c.st_status', [0, 1])
            ->select('c.id_chamado', 'c.ds_titulo', 'e.ds_empresa', 'c.dt_data_chamado', 'c.st_status', 'ma.ds_descricao_motivo as motivo')
            ->orderBy('c.dt_data_chamado', 'asc')
            ->limit(10)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id_chamado,
                'titulo' => $c->ds_titulo,
                'empresa' => $c->ds_empresa ?? 'N/A',
                'status' => $c->st_status,
                'motivo' => $c->motivo ?? 'Geral',
                'data' => Carbon::parse($c->dt_data_chamado)->format('d/m H:i'),
                'tempo_aberto' => $this->formatarTempoAberto($c->dt_data_chamado),
                'atrasado' => Carbon::parse($c->dt_data_chamado)->isBefore(Carbon::now()->subHours(48))
            ]);

        // 4. Fila de Espera (Abertos sem técnico)
        $disponiveis = Chamado::from('tb_chamados as c')
            ->leftJoin('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->leftJoin('tb_empresa as e', 'c.id_empresa', '=', 'e.id_empresa')
            ->leftJoin('tb_motivo_associado as ma', 'c.id_motivo_associado', '=', 'ma.id_motivo_associado')
            ->whereNull('rl.id_usuario')
            ->where('c.st_status', 0)
            ->select('c.id_chamado', 'c.ds_titulo', 'e.ds_empresa', 'c.dt_data_chamado', 'ma.ds_descricao_motivo as motivo')
            ->orderBy('c.dt_data_chamado', 'asc')
            ->limit(10)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id_chamado,
                'titulo' => $c->ds_titulo,
                'empresa' => $c->ds_empresa ?? 'N/A',
                'motivo' => $c->motivo ?? 'Geral',
                'data' => Carbon::parse($c->dt_data_chamado)->format('d/m H:i')
            ]);

        // 5. Performance
        $tempoMedio = DB::table('tb_historico_status_chamado as h')
            ->join('tb_chamados as c', 'h.id_chamado', '=', 'c.id_chamado')
            ->join('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->where('rl.id_usuario', $id_usuario)
            ->where('h.st_status', 9)
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, c.dt_data_chamado, h.dt_update)) as media'))
            ->first()->media ?? 0;

        // 6. Tendência Mensal (Últimos 6 meses)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $mes = Carbon::now()->subMonths($i);
            $count = DB::table('tb_historico_status_chamado as h')
                ->join('rl_chamado_usuario as rl', 'h.id_chamado', '=', 'rl.id_chamado')
                ->where('rl.id_usuario', $id_usuario)
                ->where('h.st_status', 9)
                ->whereMonth('h.dt_update', $mes->month)
                ->whereYear('h.dt_update', $mes->year)
                ->count();
            
            $monthlyTrend[] = [
                'mes' => ucfirst($mes->locale('pt_BR')->monthName),
                'resolvidos' => $count
            ];
        }

        // 7. Resolvidos por Motivo (Associado)
        $porTipo = DB::table('tb_chamados as c')
            ->join('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->join('tb_motivo_associado as ma', 'c.id_motivo_associado', '=', 'ma.id_motivo_associado')
            ->where('rl.id_usuario', $id_usuario)
            ->where('c.st_status', 9)
            ->select('ma.ds_descricao_motivo as name', DB::raw('count(*) as value'))
            ->groupBy('ma.ds_descricao_motivo')
            ->get();

        return Inertia::render('DashboardTecnico', [
            'kpis' => [
                'ativos' => $meusAtivos,
                'resolvidos' => $meusResolvidos,
                'atrasados' => $meusAtrasados,
            ],
            'dailyTrend' => $dailyTrend,
            'mesAtualPerformance' => $mesAtualPerformance,
            'monthlyTrend' => $monthlyTrend,
            'porTipo' => $porTipo,
            'tarefas' => $minhasTarefas,
            'disponiveis' => $disponiveis,
            'performance' => [
                'tempo_medio' => round($tempoMedio, 1),
                'total_geral' => $meusResolvidos + $meusAtivos
            ]
        ]);
    }
}
