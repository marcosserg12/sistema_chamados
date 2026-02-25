<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmpresaController extends Controller
{
    // Método privado para garantir que só o Super Admin (5) acessa
    private function checkAccess()
    {
        if (auth()->user()->id_perfil != 5) {
            abort(403, 'Acesso restrito apenas a Super Administradores.');
        }
    }

    // ==========================================
    // 1. LISTAGEM COM PESQUISA
    // ==========================================
    public function index(Request $request)
    {
        $this->checkAccess();

        $query = Empresa::query();

        // Pesquisa por Nome ou CNPJ
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('ds_empresa', 'like', "%{$search}%")
                  ->orWhere('nu_cnpj', 'like', "%{$search}%");
        }

        // Paginação
        $empresasPaginadas = $query->orderBy('ds_empresa', 'asc')->paginate(15)->withQueryString();

        // Transformamos a coleção para o React
        $empresasPaginadas->getCollection()->transform(function ($empresa) {
            return [
                'id_empresa' => $empresa->id_empresa,
                'nome' => $empresa->ds_empresa,
                'cnpj' => $empresa->nu_cnpj,
                'endereco' => $empresa->ds_endereco,
                'email' => $empresa->ds_email,
                'telefone' => $empresa->nu_telefone,
                'responsavel' => $empresa->ds_responsavel,
                // O seu banco usa 'A' para Ativo e 'I' (ou NULL) para inativo
                'ativo' => $empresa->st_status === 'A',
            ];
        });

        return Inertia::render('Empresas', [
            'empresas' => $empresasPaginadas,
            'filters' => $request->only(['search'])
        ]);
    }

    // ==========================================
    // 2. CRIAR NOVA EMPRESA
    // ==========================================
    public function store(Request $request)
    {
        $this->checkAccess();

        $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'nullable|email',
        ]);

        Empresa::create([
            'ds_empresa' => $request->nome,
            'nu_cnpj' => $request->cnpj,
            'ds_endereco' => $request->endereco,
            'ds_email' => $request->email,
            'nu_telefone' => $request->telefone,
            'ds_responsavel' => $request->responsavel,
            'st_status' => 'A' // 'A' para Ativo por padrão
        ]);

        return redirect()->back();
    }

    // ==========================================
    // 3. ATUALIZAR EMPRESA EXISTENTE
    // ==========================================
    public function update(Request $request, $id)
    {
        $this->checkAccess();

        $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'nullable|email',
        ]);

        $empresa = Empresa::findOrFail($id);

        $empresa->update([
            'ds_empresa' => $request->nome,
            'nu_cnpj' => $request->cnpj,
            'ds_endereco' => $request->endereco,
            'ds_email' => $request->email,
            'nu_telefone' => $request->telefone,
            'ds_responsavel' => $request->responsavel,
        ]);

        return redirect()->back();
    }

    // ==========================================
    // 4. ATIVAR / DESATIVAR (TOGGLE STATUS)
    // ==========================================
    public function toggleStatus($id)
    {
        $this->checkAccess();

        $empresa = Empresa::findOrFail($id);

        // Inverte o status atual ('A' <-> 'I')
        $empresa->st_status = ($empresa->st_status === 'A') ? 'I' : 'A';
        $empresa->save();

        return redirect()->back();
    }
}