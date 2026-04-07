<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Perfil;
use App\Models\Empresa;
use App\Models\Localizacao;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->id_perfil, [1, 5])) {
            abort(403);
        }

        // 1. Query de Usuários (Mantém igual)
        $query = Usuario::with(['perfil', 'empresas', 'localizacoes']); // Carrega vínculos

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ds_nome', 'like', "%{$search}%")
                    ->orWhere('ds_email', 'like', "%{$search}%")
                    ->orWhere('ds_usuario', 'like', "%{$search}%");
            });
        }

        if ($request->filled('edit')) {
            $query->orWhere('id_usuario', $request->edit);
        }

        $usuarios = $query->orderBy('ds_nome')->paginate(12)->withQueryString();

        $usuarios->getCollection()->transform(function ($u) {
            return [
                'id' => $u->id_usuario,
                'name' => $u->ds_nome,
                'email' => $u->ds_email,
                'login' => $u->ds_usuario,
                'phone' => $u->nu_telefone,
                'role_id' => $u->id_perfil,
                'role_name' => $u->perfil->ds_perfil ?? 'Indefinido',
                'ativo' => $u->st_ativo === 'A',
                // Retorna arrays de IDs para preencher os checkboxes na edição
                'empresas_ids' => $u->empresas->pluck('id_empresa')->map(fn($id) => (string)$id)->toArray(),
                'localizacoes_ids' => $u->localizacoes->pluck('id_localizacao')->map(fn($id) => (string)$id)->toArray(),
            ];
        });

        $perfis = Perfil::where('id_perfil', '!=', 5)
            ->select('id_perfil', 'ds_perfil')
            ->orderBy('ds_perfil')
            ->get();

        // =========================================================
        // NOVA LÓGICA: Carregar Empresas COM Localizações
        // =========================================================
        $queryEmpresas = Empresa::with(['localizacoes' => function ($q) {
            $q->where('st_ativo', 'A');
        }])->where('st_status', 'A');

        if ($user->id_perfil != 5) {
            $meusIdsEmpresas = $user->empresas->pluck('id_empresa')->toArray();
            $queryEmpresas->whereIn('id_empresa', $meusIdsEmpresas);
        }

        $empresas = $queryEmpresas->orderBy('ds_empresa')->get();

        return Inertia::render('Usuarios', [
            'usuarios' => $usuarios,
            'perfis' => $perfis,
            'empresas' => $empresas,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tb_usuario_laravel,ds_email',
            'login' => 'required|string|unique:tb_usuario_laravel,ds_usuario',
            'role' => 'required',
            // Agora validamos arrays
            'empresas' => 'required|array|min:1',
            'localizacoes' => 'array',
        ]);

        $senhaGerada = Str::random(8);
        $telefoneLimpo = $request->phone ? preg_replace('/\D/', '', $request->phone) : null;

        $usuario = Usuario::create([
            'ds_nome' => $request->name,
            'ds_email' => $request->email,
            'ds_usuario' => $request->login,
            'nu_telefone' => $telefoneLimpo,
            'ds_senha' => Hash::make($senhaGerada),
            'id_perfil' => $request->role,
            'st_ativo' => 'A'
        ]);

        // Salva os relacionamentos na tabela ternária rl_usuario_empresa_localizacao
        $this->syncVinculos($usuario, $request->empresas, $request->localizacoes ?? []);

        return redirect()->back()->with('success_password', $senhaGerada);
    }

    public function update(Request $request, $id)
    {
        $usuario = Usuario::findOrFail($id);

        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:tb_usuario_laravel,ds_email,' . $id . ',id_usuario',
            'login' => 'required|unique:tb_usuario_laravel,ds_usuario,' . $id . ',id_usuario',
            'empresas' => 'required|array|min:1',
            'localizacoes' => 'array',
        ]);

        $telefoneLimpo = $request->phone ? preg_replace('/\D/', '', $request->phone) : null;

        $usuario->update([
            'ds_nome' => $request->name,
            'ds_email' => $request->email,
            'ds_usuario' => $request->login,
            'nu_telefone' => $telefoneLimpo,
            'id_perfil' => $request->role,
        ]);

        // Atualiza os relacionamentos na tabela ternária rl_usuario_empresa_localizacao
        $this->syncVinculos($usuario, $request->empresas, $request->localizacoes ?? []);

        return redirect()->back();
    }

    /**
     * Sincroniza os vínculos ternários (Usuário x Empresa x Localização)
     */
    private function syncVinculos($usuario, array $empresasIds, array $localizacoesIds)
    {
        DB::table('rl_usuario_empresa_localizacao')->where('id_usuario', $usuario->id_usuario)->delete();

        $vinculos = [];

        foreach ($empresasIds as $idEmpresa) {
            // Busca quais das localizações selecionadas pertencem a esta empresa
            $locaisDestaEmpresa = DB::table('rl_empresa_localizacao')
                ->where('id_empresa', $idEmpresa)
                ->whereIn('id_localizacao', $localizacoesIds)
                ->pluck('id_localizacao');

            if ($locaisDestaEmpresa->count() > 0) {
                // Se houver localizações selecionadas para esta empresa, cria uma linha para cada uma
                foreach ($locaisDestaEmpresa as $idLocalizacao) {
                    $vinculos[] = [
                        'id_usuario' => $usuario->id_usuario,
                        'id_empresa' => $idEmpresa,
                        'id_localizacao' => $idLocalizacao
                    ];
                }
            } else {
                // Se a empresa foi selecionada mas nenhuma localização dela foi,
                // cria uma linha com id_localizacao NULL para garantir acesso à empresa
                $vinculos[] = [
                    'id_usuario' => $usuario->id_usuario,
                    'id_empresa' => $idEmpresa,
                    'id_localizacao' => null
                ];
            }
        }

        if (!empty($vinculos)) {
            DB::table('rl_usuario_empresa_localizacao')->insert($vinculos);
        }
    }
}
