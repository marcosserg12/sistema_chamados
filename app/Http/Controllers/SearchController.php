<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Models\Patrimonio;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function globalSearch(Request $request)
    {
        $query = $request->input('q');
        if (empty($query)) {
            return response()->json([]);
        }

        $user = auth()->user();
        $perfilId = $user->id_perfil;
        $isSuperAdmin = $perfilId === 5;
        $isAdmin = $perfilId === 1;

        $results = [];

        // 1. Pesquisar Chamados
        $chamados = Chamado::where(function($q) use ($query) {
                $q->where('ds_titulo', 'like', "%{$query}%")
                  ->orWhere('id_chamado', 'like', "%{$query}%")
                  ->orWhere('ds_descricao', 'like', "%{$query}%");
            })
            ->porPerfil($user) // Respeita a visibilidade do usuário
            ->limit(5)
            ->get()
            ->map(function($c) {
                return [
                    'id' => $c->id_chamado,
                    'title' => $c->ds_titulo,
                    'type' => 'Chamado',
                    'url' => "/chamados/{$c->id_chamado}",
                    'subtitle' => "#{$c->id_chamado}"
                ];
            });
        
        foreach ($chamados as $c) $results[] = $c;

        // 2. Pesquisar Patrimônios (Apenas Admin/SuperAdmin)
        if ($isAdmin || $isSuperAdmin) {
            $patrimonios = Patrimonio::where('ds_codigo', 'like', "%{$query}%")
                ->orWhere('ds_marca', 'like', "%{$query}%")
                ->orWhere('ds_modelo', 'like', "%{$query}%")
                ->orWhere('ds_num_serie', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(function($p) {
                    return [
                        'id' => $p->id_patrimonio,
                        'title' => $p->ds_codigo,
                        'type' => 'Patrimônio',
                        'url' => "/patrimonios?edit={$p->id_patrimonio}",
                        'subtitle' => "{$p->ds_marca} {$p->ds_modelo}"
                    ];
                });
            foreach ($patrimonios as $p) $results[] = $p;
        }

        // 3. Pesquisar Usuários (Apenas Admin/SuperAdmin)
        if ($isAdmin || $isSuperAdmin) {
            $usuarios = User::where('ds_nome', 'like', "%{$query}%")
                ->orWhere('ds_email', 'like', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(function($u) {
                    return [
                        'id' => $u->id_usuario,
                        'title' => $u->ds_nome,
                        'type' => 'Usuário',
                        'url' => "/usuarios?edit={$u->id_usuario}",
                        'subtitle' => $u->ds_email
                    ];
                });
            foreach ($usuarios as $u) $results[] = $u;
        }

        return response()->json($results);
    }
}
