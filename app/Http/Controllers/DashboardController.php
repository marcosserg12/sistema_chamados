<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $id_perfil = $user->id_perfil;

        // =======================================================
        // 1. QUERY ESPECÍFICA DO USUÁRIO (Eloquent + Scopes)
        // =======================================================
        $queryUsuario = Chamado::visivelNoDashboard($user)
            ->with(['solicitante', 'tecnico', 'motivoAssociado']);

        // KPIs do Usuário usando agregação
        $kpisUsuario = [
            'abertos' => (clone $queryUsuario)->where('st_status', 0)->count(),
            'emAndamento' => (clone $queryUsuario)->where('st_status', 1)->count(),
            'resolvidos' => (clone $queryUsuario)->where('st_status', 9)->count(),
        ];

        // Lista de Recentes (visões gerais base)
        $chamadosRecentes = (clone $queryUsuario)
            ->orderByRaw('CASE WHEN st_status = 1 THEN 1 ELSE 0 END DESC')
            ->orderByRaw('CASE WHEN st_status = 0 THEN 1 ELSE 0 END DESC')
            ->orderBy('id_chamado', 'desc')
            ->limit(10)
            ->get();

        // Lista da Fila do Técnico (Apenas chamados atribuídos a ele)
        $minhaFila = [];
        if (in_array($user->id_perfil, [1, 4, 5])) { // Perfis que são técnicos ou admins
             $minhaFila = Chamado::whereHas('relacionamentoUsuarios', function ($q) use ($user) {
                    $q->where('id_usuario', $user->id_usuario);
                })
                ->where('st_status', '!=', 9) // Ignorar resolvidos
                ->leftJoin('rl_chamado_usuario as rl', function($join) use ($user) {
                    $join->on('tb_chamados.id_chamado', '=', 'rl.id_chamado')
                         ->where('rl.id_usuario', '=', $user->id_usuario);
                })
                ->with(['solicitante', 'empresa', 'motivoAssociado'])
                ->select('tb_chamados.*', 'rl.ordem_fila')
                ->orderByRaw('CASE WHEN rl.ordem_fila IS NULL THEN 1 ELSE 0 END') // Os nulos vão pro final
                ->orderBy('rl.ordem_fila', 'asc')
                ->orderBy('tb_chamados.id_chamado', 'asc')
                ->get();
        }

        // =======================================================
        // 2. QUERY GERAL DO SISTEMA (Apenas Admin e Técnico)
        // =======================================================
        $graficoStatus = null;
        $trendSemanal = [];

        if ($id_perfil == 1 || $id_perfil == 4 || $id_perfil == 5) {

            // Gráfico de Pizza: Agora respeita a visibilidade (Meus + Abertos)
            $graficoStatus = [
                'abertos' => (clone $queryUsuario)->where('st_status', 0)->count(),
                'emAndamento' => (clone $queryUsuario)->where('st_status', 1)->count(),
                'resolvidos' => (clone $queryUsuario)->where('st_status', 9)->count(),
            ];

            // Tendência Semanal
            for ($i = 6; $i >= 0; $i--) {
                $data = Carbon::now()->subDays($i);
                $dataStr = $data->format('Y-m-d');

                // "Meus" aqui são APENAS os que eu aceitei/estou trabalhando (atribuídos)
                $meusChamadosQuery = Chamado::whereHas('relacionamentoUsuarios', function ($q) use ($user) {
                    $q->where('id_usuario', $user->id_usuario);
                });

                $trendSemanal[] = [
                    'dia' => ucfirst($data->locale('pt_BR')->shortDayName),
                    'total' => Chamado::visivelNoDashboard($user)->whereDate('dt_data_chamado', $dataStr)->count(), 
                    'meus' => $meusChamadosQuery->whereDate('dt_data_chamado', $dataStr)->count(),
                ];
            }
        }

        return Inertia::render('Dashboard', [
            'kpis' => $kpisUsuario,
            'chamadosRecentes' => $chamadosRecentes,
            'minhaFila' => $minhaFila,
            'graficoStatus' => $graficoStatus,
            'trendSemanal' => $trendSemanal
        ]);
    }
}