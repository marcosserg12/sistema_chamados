<?php

namespace App\Http\Controllers;

use App\Models\TipoChamado;
use App\Models\MotivoPrincipal;
use App\Models\MotivoAssociado;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfiguracaoChamadoController extends Controller
{
    public function index()
    {
        return Inertia::render('Motivos', [
            'tipos' => TipoChamado::orderBy('ds_tipo_chamado')->get(),
            'motivos' => MotivoPrincipal::with('tipo')->orderBy('ds_descricao')->get(),
            'associados' => MotivoAssociado::with(['motivoPrincipal.tipo', 'empresa'])->orderBy('ds_descricao_motivo')->get(),
            'empresas' => Empresa::select('id_empresa', 'ds_empresa')->orderBy('ds_empresa')->get()
        ]);
    }

    // ================== TIPO CHAMADO ==================
    public function storeTipo(Request $request) {
        $data = $request->validate(['ds_tipo_chamado' => 'required|string|max:200']);
        $data['st_ativo'] = 'A';

        TipoChamado::create($data);
        // O with('message') envia o flash para o Inertia
        return back()->with('message', 'Tipo cadastrado com sucesso!');
    }

    public function updateTipo(Request $request, $id) {
        $item = TipoChamado::findOrFail($id);
        // Adicionamos st_ativo como 'sometimes' para aceitar se vier no request
        $data = $request->validate([
            'ds_tipo_chamado' => 'sometimes|required|string|max:200',
            'st_ativo' => 'sometimes|string|in:A,I'
        ]);

        $item->update($data);
        return back()->with('message', 'Tipo atualizado com sucesso!');
    }

    // ================== MOTIVO PRINCIPAL ==================
    public function storeMotivo(Request $request) {
        $data = $request->validate([
            'ds_descricao' => 'required|string|max:200',
            'id_tipo_chamado' => 'required|exists:tb_tipo_chamado,id_tipo_chamado'
        ]);
        $data['st_ativo'] = 'A';

        MotivoPrincipal::create($data);
        return back()->with('message', 'Motivo cadastrado com sucesso!');
    }

    public function updateMotivo(Request $request, $id) {
        $item = MotivoPrincipal::findOrFail($id);
        $data = $request->validate([
            'ds_descricao' => 'sometimes|required|string|max:200',
            'id_tipo_chamado' => 'sometimes|required|exists:tb_tipo_chamado,id_tipo_chamado',
            'st_ativo' => 'sometimes|string|in:A,I'
        ]);

        $item->update($data);
        return back()->with('message', 'Motivo atualizado com sucesso!');
    }

    // ================== MOTIVO ASSOCIADO ==================
    public function storeAssociado(Request $request) {
        $request->merge([
            'id_empresa' => ($request->id_empresa === 'null' || empty($request->id_empresa)) ? null : $request->id_empresa
        ]);

        $data = $request->validate([
            'ds_descricao_motivo' => 'required|string',
            'id_motivo_principal' => 'required|exists:tb_motivo_principal,id_motivo_principal',
            'id_empresa' => 'nullable|exists:tb_empresa,id_empresa'
        ]);
        $data['st_ativo'] = 'A';

        MotivoAssociado::create($data);
        return back()->with('message', 'Detalhamento cadastrado com sucesso!');
    }

    public function updateAssociado(Request $request, $id) {
        $item = MotivoAssociado::findOrFail($id);

        // Tratamento do null antes da validação
        if ($request->has('id_empresa')) {
            $request->merge([
                'id_empresa' => ($request->id_empresa === 'null' || empty($request->id_empresa)) ? null : $request->id_empresa
            ]);
        }

        $data = $request->validate([
            'ds_descricao_motivo' => 'sometimes|required|string',
            'id_motivo_principal' => 'sometimes|required|exists:tb_motivo_principal,id_motivo_principal',
            'id_empresa' => 'nullable|exists:tb_empresa,id_empresa',
            'st_ativo' => 'sometimes|string|in:A,I'
        ]);

        $item->update($data);
        return back()->with('message', 'Detalhamento atualizado com sucesso!');
    }
}