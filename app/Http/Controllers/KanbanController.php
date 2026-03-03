<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class KanbanController extends Controller
{
    /**
     * Display the Kanban board.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Only allow admins and tech users
        if (!in_array($user->id_perfil, [1, 4, 5])) {
            return redirect()->route('chamados.index');
        }

        $query = Chamado::query()
            ->visivelPara($user)
            ->leftJoin('tb_usuario_laravel as u_solic', 'tb_chamados.id_usuario', '=', 'u_solic.id_usuario')
            ->leftJoin('rl_chamado_usuario as rl', 'tb_chamados.id_chamado', '=', 'rl.id_chamado')
            ->leftJoin('tb_usuario_laravel as u_tec', 'rl.id_usuario', '=', 'u_tec.id_usuario')
            ->leftJoin('tb_motivo_associado as ma', 'tb_chamados.id_motivo_associado', '=', 'ma.id_motivo_associado')
            ->select(
                'tb_chamados.id_chamado',
                'tb_chamados.ds_titulo',
                'tb_chamados.st_status',
                'tb_chamados.ordem_kanban',
                'tb_chamados.dt_data_chamado',
                'tb_chamados.st_grau',
                'u_solic.ds_nome as ds_nome_solicitante',
                'u_solic.ds_foto as ds_foto_solicitante',
                'u_tec.ds_nome as ds_nome_tecnico',
                'u_tec.ds_foto as ds_foto_tecnico',
                'u_tec.id_usuario as id_tecnico',
                'ma.ds_descricao_motivo as ds_motivo'
            )
            // Prioriza o técnico logado se o status for 'Em Andamento' (1)
            ->orderByRaw("CASE WHEN tb_chamados.st_status = 1 AND rl.id_usuario = ? THEN 0 ELSE 1 END", [$user->id_usuario])
            ->orderBy('tb_chamados.ordem_kanban', 'asc')
            ->orderBy('tb_chamados.id_chamado', 'desc');

        $chamados = $query->get();

        // Agrupar por status para o Kanban
        $columns = [
            '0' => [
                'id' => '0',
                'title' => 'Aberto',
                'cards' => []
            ],
            '1' => [
                'id' => '1',
                'title' => 'Em Andamento',
                'cards' => []
            ],
            '9' => [
                'id' => '9',
                'title' => 'Resolvido',
                'cards' => []
            ]
        ];

        foreach ($chamados as $chamado) {
            $statusStr = (string)$chamado->st_status;
            if (isset($columns[$statusStr])) {
                $columns[$statusStr]['cards'][] = $chamado;
            }
        }

        return Inertia::render('KanbanBoard', [
            'initialColumns' => $columns
        ]);
    }

    /**
     * Update the status and order of tickets in the Kanban board.
     */
    public function move(Request $request)
    {
        $user = auth()->user();
        if (!in_array($user->id_perfil, [1, 4, 5])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'id_chamado' => 'required|integer|exists:tb_chamados,id_chamado',
            'new_status' => 'required|integer',
            'new_order'  => 'required|integer',
            'reordered_cards' => 'nullable|array' // Array with id_chamado => ordem
        ]);

        $chamado = Chamado::findOrFail($request->id_chamado);

        $oldStatus = $chamado->st_status;
        $newStatus = $request->new_status;

        // Optionally, we can use the ChamadoService to trigger proper updates, 
        // e.g. HistoricoStatusChamado and notifications.
        if ($oldStatus != $newStatus) {
            $service = app(\App\Services\ChamadoService::class);
            $service->atualizarStatus($chamado, $newStatus, $user);
        }

        $chamado->ordem_kanban = $request->new_order;
        $chamado->save();

        if ($request->has('reordered_cards')) {
            foreach ($request->reordered_cards as $id => $order) {
                Chamado::where('id_chamado', $id)->update(['ordem_kanban' => $order]);
            }
        }

        return response()->json(['success' => true]);
    }
}
