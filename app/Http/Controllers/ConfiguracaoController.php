<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ConfiguracaoController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // 1. Busca Empresas (Adicionado distinct para evitar duplicatas por causa da pivot rl_usuario_empresa_localizacao)
        if ($user->id_perfil == 5) {
            $empresas = Empresa::orderBy('ds_empresa')->get();
        } else {
            $empresas = $user->empresas()
                ->select('tb_empresa.id_empresa', 'tb_empresa.ds_empresa')
                ->distinct()
                ->orderBy('ds_empresa')
                ->get();
        }

        // 2. Busca Localizações
        $queryLoc = DB::table('tb_localizacao as l')
            ->join('rl_empresa_localizacao as rl', 'l.id_localizacao', '=', 'rl.id_localizacao')
            ->select('l.id_localizacao', 'l.ds_localizacao', 'rl.id_empresa')
            ->orderBy('l.ds_localizacao');

        if ($user->id_perfil != 5) {
            $meusIdsEmpresas = $user->empresas->pluck('id_empresa')->toArray();
            $queryLoc->whereIn('rl.id_empresa', $meusIdsEmpresas);
        }

        $localizacoes = $queryLoc->get();

        return Inertia::render('Configuracoes', [
            'empresas' => $empresas,
            'localizacoes' => $localizacoes
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();
        $atuais = $user->preferencias ?? [];
        $novas = array_merge($atuais, $request->all());
        $user->preferencias = $novas;
        $user->save();

        return redirect()->back();
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'ds_nome' => 'required|string|max:255',
            'nu_telefone' => 'nullable|string|max:20',
        ]);

        // Limpa o telefone para salvar apenas números
        if ($request->filled('nu_telefone')) {
            $validated['nu_telefone'] = preg_replace('/\D/', '', $request->nu_telefone);
        }

        $user->update($validated);

        return redirect()->back()->with('success', 'Perfil atualizado com sucesso!');
    }

    public function updatePhoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image|max:2048',
        ]);

        $user = auth()->user();

        if ($user->ds_foto) {
            Storage::disk('public')->delete($user->ds_foto);
        }

        $path = $request->file('foto')->store('profiles', 'public');
        $user->ds_foto = $path;
        $user->save();

        return redirect()->back();
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ], [
            'current_password.current_password' => 'A senha atual está incorreta.',
            'password.confirmed' => 'A confirmação da nova senha não confere.',
        ]);

        $user = auth()->user();
        $user->update([
            'ds_senha' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', 'Senha alterada com sucesso!');
    }
}
