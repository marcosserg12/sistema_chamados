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
        $queryUsuario = Chamado::visivelPara($user)
            ->with(['solicitante', 'tecnico', 'motivoAssociado']);

        // KPIs do Usuário usando agregação
        $kpisUsuario = [
            'abertos' => (clone $queryUsuario)->where('st_status', 0)->count(),
            'emAndamento' => (clone $queryUsuario)->where('st_status', 1)->count(),
            'resolvidos' => (clone $queryUsuario)->where('st_status', 9)->count(),
        ];


        // Lista de Recentes
        $chamadosRecentes = $queryUsuario
            ->orderByRaw('CASE WHEN st_status = 1 THEN 1 ELSE 0 END DESC')
            ->orderByRaw('CASE WHEN st_status = 0 THEN 1 ELSE 0 END DESC')
            ->orderBy('id_chamado', 'desc')
            ->limit(10)
            ->get();

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
                    'total' => Chamado::whereDate('dt_data_chamado', $dataStr)->count(), // Total de criados no sistema
                    'meus' => $meusChamadosQuery->whereDate('dt_data_chamado', $dataStr)->count(),
                ];
            }
        }

        return Inertia::render('Dashboard', [
            'kpis' => $kpisUsuario,
            'chamadosRecentes' => $chamadosRecentes,
            'graficoStatus' => $graficoStatus,
            'trendSemanal' => $trendSemanal
        ]);
    }
}