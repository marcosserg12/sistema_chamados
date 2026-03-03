<?php

namespace App\Http\Controllers;

use App\Models\ChamadoChecklist;
use Illuminate\Http\Request;

class ChamadoChecklistController extends Controller
{
    public function index($id_chamado)
    {
        return response()->json(
            ChamadoChecklist::where('id_chamado', $id_chamado)
                ->orderBy('dt_criacao', 'asc')
                ->get()
        );
    }

    public function store(Request $request, $id_chamado)
    {
        $request->validate([
            'ds_item' => 'required|string|max:255',
        ]);

        $item = ChamadoChecklist::create([
            'id_chamado' => $id_chamado,
            'ds_item' => $request->ds_item,
            'st_concluido' => false,
            'dt_criacao' => now(),
            'dt_update' => now(),
        ]);

        return response()->json($item);
    }

    public function toggle(Request $request, $id)
    {
        $item = ChamadoChecklist::findOrFail($id);
        $item->st_concluido = !$item->st_concluido;
        $item->dt_update = now();
        $item->save();

        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = ChamadoChecklist::findOrFail($id);
        $item->delete();

        return response()->json(['success' => true]);
    }
}
