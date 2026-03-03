<?php

namespace App\Http\Controllers;

use App\Models\KanbanObservacao;
use Illuminate\Http\Request;

class KanbanObservacaoController extends Controller
{
    public function store(Request $request, $id_chamado)
    {
        $request->validate([
            'ds_observacao' => 'required|string',
        ]);

        try {
            $userId = auth()->id();
            
            if (!$userId) {
                return response()->json(['error' => 'Usuário não autenticado'], 401);
            }

            $observacao = KanbanObservacao::create([
                'id_chamado' => (int) $id_chamado,
                'id_usuario' => (int) $userId,
                'ds_observacao' => $request->ds_observacao,
                'dt_criacao' => now(),
                'dt_update' => now(),
            ]);

            return response()->json($observacao);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $observacao = KanbanObservacao::findOrFail($id);
        
        // Opcional: Validar se o usuário pode deletar (ex: se é o dono ou admin)
        
        $observacao->delete();

        return response()->json(['success' => true]);
    }
}
