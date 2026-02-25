<?php

namespace App\Http\Controllers;

use App\Models\Patrimonio;
use App\Models\TipoProduto;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatrimonioController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        // 1. Query Principal de Patrimônios
        $query = Patrimonio::with(['empresa', 'tipo']);

        // Multi-tenancy: Filtra patrimônios visíveis
        if ($user->id_perfil != 5) {
            // Pega IDs únicos das empresas do usuário
            $meusIds = $user->empresas()->pluck('tb_empresa.id_empresa')->unique();
            $query->whereIn('id_empresa', $meusIds);
        }

        // Filtro de busca
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('ds_codigo', 'like', "%$s%")
                  ->orWhere('ds_marca', 'like', "%$s%")
                  ->orWhere('ds_modelo', 'like', "%$s%");
            });
        }

        // Se estiver editando, garante que o item apareça no topo ou seja incluído
        if ($request->filled('edit')) {
            $query->orWhere('id_patrimonio', $request->edit);
        }

        $patrimonios = $query->paginate(12)->withQueryString();

        // 2. Query de Empresas para o Select (CORREÇÃO AQUI)
        // Usamos o distinct() para evitar duplicatas
        if ($user->id_perfil == 5) {
            $empresas = Empresa::select('id_empresa', 'ds_empresa')
                ->distinct()
                ->orderBy('ds_empresa')
                ->get();
        } else {
            // Se for usuário comum, pega pelo relacionamento mas aplica distinct
            $empresas = $user->empresas()
                ->select('tb_empresa.id_empresa', 'tb_empresa.ds_empresa')
                ->distinct() // <--- O SEGREDO ESTÁ AQUI
                ->orderBy('ds_empresa')
                ->get();
        }

        return Inertia::render('Patrimonios', [
            'patrimonios' => $patrimonios,
            'tipos' => TipoProduto::all(),
            'empresas' => $empresas,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ds_codigo' => 'required|unique:tb_patrimonio,ds_codigo',
            'id_tipo_produto' => 'required|exists:tb_tipo_produto,id_tipo_produto',
            'id_empresa' => 'required|exists:tb_empresa,id_empresa',
        ]);

        Patrimonio::create($request->all());
        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $patrimonio = Patrimonio::findOrFail($id);

        $request->validate([
            // O 3º parâmetro ignora o ID atual na verificação de unique
            'ds_codigo' => 'required|unique:tb_patrimonio,ds_codigo,'.$id.',id_patrimonio',
            'id_tipo_produto' => 'required|exists:tb_tipo_produto,id_tipo_produto',
            'id_empresa' => 'required|exists:tb_empresa,id_empresa',
        ]);

        $patrimonio->update($request->all());

        return redirect()->back();
    }
}