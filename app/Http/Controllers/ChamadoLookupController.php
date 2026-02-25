<?php

namespace App\Http\Controllers;

use App\Models\Localizacao;
use App\Models\MotivoPrincipal;
use App\Models\MotivoAssociado;
use Illuminate\Http\Request;

class ChamadoLookupController extends Controller
{
    // Busca setores/unidades da empresa selecionada
    public function getLocalizacoes($empresa_id)
    {
        return response()->json(
            Localizacao::where('id_empresa', $empresa_id)
                ->orderBy('ds_localizacao')
                ->get()
        );
    }

    // Busca motivos baseados no tipo (Software, Hardware, etc)
    public function getMotivos($tipo_id)
    {
        return response()->json(
            MotivoPrincipal::where('id_tipo_chamado', $tipo_id)
                ->orderBy('ds_descricao')
                ->get()
        );
    }

    // Busca o detalhamento final (Motivo Associado)
    public function getDetalhamentos(Request $request, $motivo_id)
    {
        $query = MotivoAssociado::where('id_motivo_principal', $motivo_id);

        // Se o motivo exigir filtro por empresa (como seu ID 6 antigo)
        if ($request->has('empresa_id')) {
            $query->where('id_empresa', $request->empresa_id);
        }

        return response()->json($query->orderBy('ds_descricao_motivo')->get());
    }
}