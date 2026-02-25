<?php

namespace App\Http\Controllers;

use App\Models\Localizacao;
use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocalizacaoController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        // Apenas Admin (1) e Super Admin (5)
        if (!in_array($user->id_perfil, [1, 5])) {
            abort(403);
        }

        // Inicia a query base carregando as empresas
        $query = Localizacao::with('empresas');

        // LÓGICA DE FILTRAGEM POR EMPRESA
        if ($user->id_perfil != 5) {
            // Se NÃO for Super Admin, filtra pelas empresas do usuário
            // 1. Pega os IDs das empresas que o usuário tem acesso
            $empresasDoUsuario = \App\Models\Usuario::find($user->id_usuario)->empresas()->pluck('tb_empresa.id_empresa')->toArray();

            // 2. Filtra localizações que tenham vínculo com essas empresas
            $query->whereHas('empresas', function ($q) use ($empresasDoUsuario) {
                $q->whereIn('tb_empresa.id_empresa', $empresasDoUsuario);
            });
        }

        // Filtro de Busca (Texto)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('ds_localizacao', 'like', "%{$search}%");
        }

        // Paginação
        $localizacoes = $query->orderBy('ds_localizacao')->paginate(12)->withQueryString();

        // Transformação para o Frontend
        $localizacoes->getCollection()->transform(function ($loc) {
            return [
                'id' => $loc->id_localizacao,
                'nome' => $loc->ds_localizacao,
                'ativo' => $loc->st_ativo === 'A',
                'empresas_ids' => $loc->empresas->pluck('id_empresa')->map(fn($id) => (string)$id)->toArray(),
                'empresas_nomes' => $loc->empresas->pluck('ds_empresa')->join(', '),
            ];
        });

        // =================================================================
        // FILTRO DO SELECT DO MODAL
        // =================================================================
        // O Admin só pode criar localizações para as empresas que ele gerencia
        $queryEmpresas = Empresa::select('id_empresa', 'ds_empresa')
            ->where('st_status', 'A')
            ->orderBy('ds_empresa');

        if ($user->id_perfil != 5) {
            // Filtra o select também
            $idsEmpresas = \App\Models\Usuario::find($user->id_usuario)->empresas()->pluck('tb_empresa.id_empresa');
            $queryEmpresas->whereIn('id_empresa', $idsEmpresas);
        }

        $empresasDisponiveis = $queryEmpresas->get();

        return Inertia::render('Localizacoes', [
            'localizacoes' => $localizacoes,
            'empresasDisponiveis' => $empresasDisponiveis, // Agora filtrado
            'filters' => $request->only(['search'])
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'nome' => 'required|string|max:255',
            'empresas' => 'required|array', // Array de IDs
            'empresas.*' => 'exists:tb_empresa,id_empresa'
        ]);

        $localizacao = Localizacao::create([
            'ds_localizacao' => $request->nome,
            'st_ativo' => 'A'
        ]);

        // Salva na tabela pivô rl_empresa_localizacao
        $localizacao->empresas()->sync($request->empresas);

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $localizacao = Localizacao::findOrFail($id);

        $request->validate([
            'nome' => 'required|string|max:255',
            'empresas' => 'required|array',
            'empresas.*' => 'exists:tb_empresa,id_empresa'
        ]);

        $localizacao->update([
            'ds_localizacao' => $request->nome,
        ]);

        // Atualiza a tabela pivô
        $localizacao->empresas()->sync($request->empresas);

        return redirect()->back();
    }

    public function toggleStatus($id)
    {
        $loc = Localizacao::findOrFail($id);
        $loc->st_ativo = ($loc->st_ativo === 'A') ? 'I' : 'A';
        $loc->save();
        return redirect()->back();
    }
}