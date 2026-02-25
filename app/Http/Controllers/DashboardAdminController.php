<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Chamado;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardAdminController extends Controller
{
    // Função auxiliar para formatar o tempo (agora no formato solicitado)
    private function formatarTempoAberto($dataCriacao) {
        $dataInicial = Carbon::parse($dataCriacao);
        $agora = Carbon::now();
        $diff = $dataInicial->diff($agora);

        // Retorna exemplo: "2 dias e 5 horas" ou "0 dias e 12 horas"
        return "{$diff->days} dias e {$diff->h} horas";
    }

    public function index()
    {
        // Verificar permissão
        if (!in_array(auth()->user()->id_perfil, [1, 5])) {
            return redirect()->route('chamados.index');
        }

        // 1. KPIs (SLA Removido)
        $totalChamados = Chamado::count();
        $abertos = Chamado::where('st_status', 0)->count();
        $emAndamento = Chamado::where('st_status', 1)->count();
        $resolvidos = Chamado::where('st_status', 9)->count();

        $atrasados = Chamado::whereIn('st_status', [0, 1])
            ->where('dt_data_chamado', '<', Carbon::now()->subHours(48))
            ->count();

        // 2. Gráficos

        // Tendência
        $dailyTrend = Chamado::select(DB::raw('DATE(dt_data_chamado) as date'), DB::raw('count(*) as chamados'))
            ->where('dt_data_chamado', '>=', Carbon::now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('d/m'),
                    'chamados' => $item->chamados
                ];
            });

        // Pizza (Status)
        $porStatus = Chamado::select('st_status', DB::raw('count(*) as value'))
            ->groupBy('st_status')
            ->get()
            ->map(function ($item) {
                switch ($item->st_status) {
                    case 0: $name = 'Aberto'; $color = '#3b82f6'; break; // Azul
                    case 1: $name = 'Em Andamento'; $color = '#f59e0b'; break; // Laranja
                    case 9: $name = 'Resolvido'; $color = '#10b981'; break; // Verde
                    default: $name = 'Outro'; $color = '#64748b';
                }
                return ['name' => $name, 'value' => $item->value, 'color' => $color];
            });

        // Top Localizações
        $localizacoesTop = Chamado::join('tb_localizacao', 'tb_chamados.id_localizacao', '=', 'tb_localizacao.id_localizacao')
            ->select('tb_localizacao.ds_localizacao as name', DB::raw('count(*) as value'))
            ->groupBy('tb_localizacao.ds_localizacao')
            ->orderByDesc('value')
            ->limit(5)
            ->get();

        // 3. Gestão Técnica

        // Carga Atual
        $tecnicosWorkload = DB::table('rl_chamado_usuario')
            ->join('tb_chamados', 'rl_chamado_usuario.id_chamado', '=', 'tb_chamados.id_chamado')
            ->join('tb_usuario_laravel', 'rl_chamado_usuario.id_usuario', '=', 'tb_usuario_laravel.id_usuario')
            ->whereIn('tb_chamados.st_status', [0, 1])
            ->select('tb_usuario_laravel.ds_nome as name', 'tb_usuario_laravel.id_usuario as id', 'tb_usuario_laravel.ds_foto', DB::raw('count(*) as carga'))
            ->groupBy('tb_usuario_laravel.id_usuario', 'tb_usuario_laravel.ds_nome', 'tb_usuario_laravel.ds_foto')
            ->orderByDesc('carga')
            ->get();

        // Total Histórico por Técnico
        $tecnicosTotal = DB::table('rl_chamado_usuario')
            ->join('tb_usuario_laravel', 'rl_chamado_usuario.id_usuario', '=', 'tb_usuario_laravel.id_usuario')
            ->select('tb_usuario_laravel.ds_nome as name', 'tb_usuario_laravel.ds_foto', DB::raw('count(*) as total'))
            ->groupBy('tb_usuario_laravel.id_usuario', 'tb_usuario_laravel.ds_nome', 'tb_usuario_laravel.ds_foto')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        // 4. Alertas e Tabela
        $slaAlerts = Chamado::join('tb_empresa', 'tb_chamados.id_empresa', '=', 'tb_empresa.id_empresa')
            ->whereIn('tb_chamados.st_status', [0, 1])
            ->where('tb_chamados.dt_data_chamado', '<', Carbon::now()->subHours(48))
            ->select('tb_chamados.id_chamado as id', 'tb_chamados.ds_titulo as titulo', 'tb_empresa.ds_empresa as empresa', 'tb_chamados.dt_data_chamado')
            ->orderBy('tb_chamados.dt_data_chamado')
            ->limit(5)
            ->get()
            // Usamos a nova função de formatação aqui
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'titulo' => $c->titulo,
                    'empresa' => $c->empresa,
                    'tempo_atraso' => $this->formatarTempoAberto($c->dt_data_chamado)
                ];
            });

        // Tabela Global
        $tabelaGeral = Chamado::from('tb_chamados as c')
            ->leftJoin('tb_empresa as e', 'c.id_empresa', '=', 'e.id_empresa')
            ->leftJoin('rl_chamado_usuario as rl', 'c.id_chamado', '=', 'rl.id_chamado')
            ->leftJoin('tb_usuario_laravel as tec', 'rl.id_usuario', '=', 'tec.id_usuario')
            ->whereIn('c.st_status', [0, 1])
            ->select(
                'c.id_chamado',
                'c.ds_titulo',
                'e.ds_empresa',
                'tec.ds_nome as nome_tecnico',
                'tec.ds_foto as foto_tecnico',
                'c.st_status',
                'c.dt_data_chamado'
            )
            ->orderBy('c.dt_data_chamado', 'desc')
            ->paginate(10);

        $tabelaGeral->getCollection()->transform(function($c) {
            $statusLabel = match($c->st_status) {
                0 => 'Aberto',
                1 => 'Em Andamento',
                9 => 'Resolvido',
                default => 'Desconhecido'
            };

            return [
                'id' => $c->id_chamado,
                'titulo' => $c->ds_titulo,
                'empresa' => $c->ds_empresa ?? 'N/A',
                'tecnico' => $c->nome_tecnico ?? 'Aguardando',
                'foto_tecnico' => $c->foto_tecnico,
                'status' => $statusLabel,
                'st_code' => $c->st_status,
                'data' => Carbon::parse($c->dt_data_chamado)->format('d/m/Y H:i'),
                // Usamos a nova função de formatação aqui também
                'tempo_aberto_formatado' => $this->formatarTempoAberto($c->dt_data_chamado)
            ];
        });

        return Inertia::render('DashboardAdmin', [
            'kpis' => [
                'abertos' => $abertos,
                'emAndamento' => $emAndamento,
                'resolvidos' => $resolvidos,
                'atrasados' => $atrasados,
                // 'slaCompliance' removido daqui
            ],
            'dailyTrend' => $dailyTrend,
            'porStatus' => $porStatus,
            'localizacoesTop' => $localizacoesTop,
            'tecnicosWorkload' => $tecnicosWorkload,
            'tecnicosTotal' => $tecnicosTotal,
            'slaAlerts' => $slaAlerts,
            'tabelaChamados' => $tabelaGeral
        ]);
    }
}