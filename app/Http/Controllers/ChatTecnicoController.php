<?php

namespace App\Http\Controllers;

use App\Models\ChatTecnico;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatTecnicoController extends Controller
{
    /**
     * Verifica se o usuário tem permissão para o chat técnico (1, 4 ou 5)
     */
    private function checkPermission()
    {
        $perfil = auth()->user()->id_perfil;
        if (!in_array($perfil, [1, 4, 5])) {
            abort(403, 'Acesso negado ao canal de operações.');
        }
    }

    public function index()
    {
        $this->checkPermission();

        $mensagens = ChatTecnico::with('usuario:id_usuario,ds_nome,ds_foto')
            ->orderBy('dt_envio', 'asc')
            ->limit(100) // Pega as últimas 100 mensagens
            ->get();

        return response()->json($mensagens);
    }

    public function store(Request $request)
    {
        $this->checkPermission();

        $request->validate([
            'mensagem' => 'nullable|string',
            'arquivo' => 'nullable|file|max:5120', // 5MB
        ]);

        if (!$request->mensagem && !$request->hasFile('arquivo')) {
            return response()->json(['error' => 'Envie uma mensagem ou arquivo.'], 422);
        }

        $caminhoArquivo = null;
        if ($request->hasFile('arquivo')) {
            $dataHoje = date('Y-m-d');
            $extensao = $request->file('arquivo')->getClientOriginalExtension();
            $nomeUnico = uniqid('tech_' . date('His') . '_', true) . '.' . $extensao;
            $caminhoArquivo = $request->file('arquivo')->storeAs("uploads/tech-chat/{$dataHoje}", $nomeUnico, 'public');
        }

        $chat = ChatTecnico::create([
            'id_usuario' => auth()->user()->id_usuario,
            'ds_mensagem' => $request->mensagem,
            'ds_caminho_arquivo' => $caminhoArquivo,
            'dt_envio' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => $chat->load('usuario:id_usuario,ds_nome,ds_foto')
        ]);
    }

    public function getUsers()
    {
        $this->checkPermission();

        // Lista de técnicos e admins para o sistema de menção @
        $users = User::whereIn('id_perfil', [1, 4, 5])
            ->where('st_ativo', 'A')
            ->select('id_usuario as id', 'ds_nome as name')
            ->get();

        return response()->json($users);
    }
}
