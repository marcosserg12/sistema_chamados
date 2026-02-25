<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Models\Usuario; // Mude para User se o seu Auth usar o model User
use App\Models\RelacaoChamadoUsuario;
use App\Models\ArquivoChamado;
use App\Models\HistoricoEdicao;
use App\Models\HistoricoStatusChamado;
use App\Models\HistoricoUsuarioChamado;
use App\Models\ComentarioChamado;
use App\Models\TipoChamado;
use App\Models\Empresa;
use App\Models\Localizacao;
use App\Models\MotivoPrincipal;
use App\Models\MotivoAssociado;
use App\Models\ChatChamado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ChamadoController extends Controller
{
    protected $chamadoService;

    public function __construct(\App\Services\ChamadoService $chamadoService)
    {
        $this->chamadoService = $chamadoService;
    }

    /**
     * Listagem Geral com Filtros e Estatísticas
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $filters = $request->only(['search', 'status', 'tecnico', 'localizacao']);

        // 1. Dados para os Selects
        $tecnicos = Usuario::where('id_perfil', 4)
            ->where('st_ativo', 'A')
            ->select('id_usuario', 'ds_nome')
            ->orderBy('ds_nome')
            ->get();

        $localizacoes = \App\Models\Localizacao::query()
            ->when($user->id_perfil != 5, function($q) use ($user) {
                $q->whereHas('usuarios', fn($sq) => $sq->where('tb_usuario_laravel.id_usuario', $user->id_usuario));
            })
            ->orderBy('ds_localizacao')
            ->get();

        // 2. Query Principal (Otimizada com Scopes)
        $query = Chamado::query()
            ->visivelPara($user)
            ->filtrar($filters)
            ->leftJoin('tb_usuario_laravel as u_solic', 'tb_chamados.id_usuario', '=', 'u_solic.id_usuario')
            ->leftJoin('tb_localizacao as l', 'tb_chamados.id_localizacao', '=', 'l.id_localizacao')
            ->leftJoin('rl_chamado_usuario as rl', 'tb_chamados.id_chamado', '=', 'rl.id_chamado')
            ->leftJoin('tb_usuario_laravel as u_tec', 'rl.id_usuario', '=', 'u_tec.id_usuario')
            ->leftJoin('tb_motivo_associado as ma', 'tb_chamados.id_motivo_associado', '=', 'ma.id_motivo_associado')
            ->select(
                'tb_chamados.id_chamado',
                'tb_chamados.ds_titulo',
                'tb_chamados.st_status',
                'tb_chamados.dt_data_chamado',
                'u_solic.ds_nome as ds_nome_solicitante',
                'l.ds_localizacao',
                'u_tec.ds_nome as ds_nome_tecnico',
                'u_tec.ds_foto as ds_foto_tecnico',
                'ma.ds_descricao_motivo as ds_motivo'
            );

        $chamados = $query->orderBy('tb_chamados.id_chamado', 'desc')
            ->paginate(15)
            ->withQueryString();

        // 3. Estatísticas (Reaproveitando a lógica de visibilidade e filtros)
        $statsBase = Chamado::visivelPara($user)->filtrar($filters);
        
        $stats = [
            'abertos' => (clone $statsBase)->where('st_status', 0)->count(),
            'em_andamento' => (clone $statsBase)->where('st_status', 1)->count(),
            'resolvidos' => (clone $statsBase)->where('st_status', 9)->count(),
        ];

        return Inertia::render('Chamados', [
            'chamados' => $chamados,
            'tecnicos' => $tecnicos,
            'localizacoes' => $localizacoes,
            'stats' => $stats,
            'filters' => array_merge([
                'search' => '', 'status' => 'todos', 'tecnico' => 'todos', 'localizacao' => 'todos'
            ], $filters)
        ]);
    }

    public function create()
    {
        $id_usuario = auth()->user()->id_usuario;

        $empresas = DB::table('tb_empresa as e')
            ->join('rl_usuario_empresa_localizacao as rl', 'e.id_empresa', '=', 'rl.id_empresa')
            ->where('rl.id_usuario', $id_usuario)
            ->select('e.id_empresa', 'e.ds_empresa')
            ->distinct()
            ->orderBy('e.ds_empresa', 'asc')
            ->get();

        return Inertia::render('NovoChamado', [
            'empresas' => $empresas,
            'tiposChamado' => TipoChamado::orderBy('ds_tipo_chamado')->get()
        ]);
    }

    /**
     * Salvar Novo Chamado (Via Service)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'ds_titulo' => 'required|string|max:255',
            'id_empresa' => 'required',
            'id_localizacao' => 'required',
            'id_tipo_chamado' => 'required',
            'id_motivo_principal' => 'required',
            'id_motivo_associado' => 'required',
            'ds_descricao' => 'required|string',
            'st_grau' => 'nullable',
            'ds_patrimonio' => 'nullable|string',
        ]);

        $chamado = $this->chamadoService->criarChamado(
            $data, 
            auth()->user(), 
            $request->file('arquivos') ?? []
        );

        return redirect()->route('chamados.show', $chamado->id_chamado);
    }


    /**
     * Exibir Detalhes do Chamado
     */
    public function show($id)
    {
        $id_usuario_logado = auth()->user()->id_usuario;

        $chamado = Chamado::with([
            'solicitante', 'tecnico', 'empresa', 'localizacao', 
            'tipoChamado', 'motivoPrincipal', 'motivoAssociado', 'anexos'
        ])->findOrFail($id);

        // Formatação para o frontend (mantendo compatibilidade)
        $chamadoFormatted = (object) array_merge($chamado->toArray(), [
            'ds_nome_solicitante' => $chamado->solicitante->ds_nome ?? '-',
            'ds_foto_solicitante' => $chamado->solicitante->ds_foto ?? null,
            'ds_nome_empresa' => $chamado->empresa->ds_empresa ?? '-',
            'ds_localizacao' => $chamado->localizacao->ds_localizacao ?? '-',
            'ds_tipo_chamado' => $chamado->tipoChamado->ds_tipo_chamado ?? '-',
            'ds_motivo' => $chamado->motivoPrincipal->ds_descricao ?? '-',
            'ds_detalhamento' => $chamado->motivoAssociado->ds_descricao_motivo ?? '-',
            'id_tecnico' => $chamado->tecnico->id_usuario ?? null,
            'ds_nome_tecnico' => $chamado->tecnico->ds_nome ?? null,
            'ds_foto_tecnico' => $chamado->tecnico->ds_foto ?? null,
            'anexos' => $chamado->anexos->map(fn($arq) => [
                'id' => $arq->id_arquivo,
                'name' => basename($arq->ds_caminho_arquivo),
                'path' => asset("storage/uploads/{$arq->ds_caminho_arquivo}")
            ])
        ]);

        // Montagem do Histórico (Unificado)
        $historico = $this->getHistoricoChamado($id);

        // Chat e Permissões
        $podeVerChat = ($id_usuario_logado == $chamado->id_usuario || $id_usuario_logado == $chamadoFormatted->id_tecnico);
        $chat = $podeVerChat ? ChatChamado::with('usuario:id_usuario,ds_nome,ds_foto')
            ->where('id_chamado', $id)->orderBy('dt_envio', 'asc')->get() : [];

        return Inertia::render('ChamadoDetalhes', [
            'chamado' => $chamadoFormatted,
            'historico' => $historico,
            'chat' => $chat,
            'tecnicos' => Usuario::where('id_perfil', 4)->where('st_ativo', 'A')->select('id_usuario', 'ds_nome', 'ds_foto')->get(),
            'empresas' => DB::table('tb_empresa as e')
                ->join('rl_usuario_empresa_localizacao as rl', 'e.id_empresa', '=', 'rl.id_empresa')
                ->where('rl.id_usuario', $id_usuario_logado)
                ->select('e.id_empresa', 'e.ds_empresa')->distinct()->get(),
            'tiposChamado' => TipoChamado::all()
        ]);
    }

    /**
     * Atualizar Chamado (Delegando para o Service)
     */
    public function update(Request $request, $id)
    {
        $chamado = Chamado::findOrFail($id);
        $user = auth()->user();

        // 1. Mudança de Status
        if ($request->has('st_status')) {
            $this->chamadoService->atualizarStatus($chamado, (int)$request->st_status, $user);
        }

        // 2. Atribuição de Técnico
        if ($request->has('id_tecnico')) {
            $this->chamadoService->atribuirTecnico($chamado, (int)$request->id_tecnico, $user);
        }

        // 3. Edição de Dados
        if ($request->has('ds_titulo')) {
            $chamado->update($request->only([
                'ds_titulo', 'ds_descricao', 'id_empresa', 'id_localizacao',
                'id_tipo_chamado', 'id_motivo_principal', 'id_motivo_associado',
                'st_grau', 'ds_patrimonio'
            ]));

            HistoricoEdicao::create(['id_chamado' => $id, 'id_usuario' => $user->id_usuario, 'dt_update' => now()]);

            if ($request->has('arquivos_excluidos')) {
                foreach ($request->arquivos_excluidos as $idArq) {
                    $arquivo = ArquivoChamado::find($idArq);
                    if ($arquivo) {
                        Storage::disk('public')->delete("uploads/{$arquivo->ds_caminho_arquivo}");
                        $arquivo->delete();
                    }
                }
            }

            if ($request->hasFile('arquivos')) {
                $this->chamadoService->uploadArquivos($chamado, $request->file('arquivos'));
            }
        }

        return redirect()->back();
    }

    /**
     * Gravar Comentário
     */
    public function storeComment(Request $request, $id)
    {
        $request->validate(['descricao' => 'required|string']);
        $user = auth()->user();

        $comentario = ComentarioChamado::create([
            'id_chamado' => $id,
            'id_usuario' => $user->id_usuario,
            'ds_comentario' => $request->descricao,
            'dt_comentario' => now()
        ]);

        $this->dispararNotificacaoComentario(Chamado::find($id), $user, $comentario);

        return redirect()->back();
    }

    /**
     * Métodos Auxiliares Privados
     */
    private function getHistoricoChamado($id)
    {
        $histStatus = HistoricoStatusChamado::join('tb_usuario_laravel as u', 'tb_historico_status_chamado.id_usuario', '=', 'u.id_usuario')
            ->where('id_chamado', $id)->select('u.ds_nome as ds_nome_usuario', 'u.ds_foto as ds_foto_usuario', 'tb_historico_status_chamado.dt_update as dt_insert',
                DB::raw("CASE WHEN st_status = 0 THEN 'Status alterado para: Aberto' WHEN st_status = 1 THEN 'Status alterado para: Em Andamento' WHEN st_status = 9 THEN 'Status alterado para: Resolvido' ELSE 'Status alterado' END as ds_historico"));

        $histUsuario = HistoricoUsuarioChamado::join('tb_usuario_laravel as u', 'tb_historico_usuario_chamado.id_usuario_adm', '=', 'u.id_usuario')
            ->leftJoin('tb_usuario_laravel as ud', 'tb_historico_usuario_chamado.id_usuario_desginado', '=', 'ud.id_usuario')
            ->where('id_chamado', $id)->select('u.ds_nome as ds_nome_usuario', 'u.ds_foto as ds_foto_usuario', 'tb_historico_usuario_chamado.dt_update as dt_insert',
                DB::raw("IF(ud.id_usuario IS NULL, 'Técnico removido (Chamado Reaberto)', CONCAT('Chamado atribuído para ', ud.ds_nome)) as ds_historico"));

        $histComentarios = ComentarioChamado::join('tb_usuario_laravel as u', 'tb_comentario_chamado.id_usuario', '=', 'u.id_usuario')
            ->where('id_chamado', $id)->select('u.ds_nome as ds_nome_usuario', 'u.ds_foto as ds_foto_usuario', 'dt_comentario as dt_insert',
                DB::raw("CONCAT('Observação: ', ds_comentario) as ds_historico"));

        return $histStatus->union($histUsuario)->union($histComentarios)->orderBy('dt_insert', 'desc')->get();
    }

    private function dispararNotificacaoComentario($chamado, $user, $comentario)
    {
        if (!$chamado) return;

        $notification = new \App\Notifications\NovoComentario($chamado, $user, $comentario);
        $whatsapp = app(\App\Services\EvolutionService::class);
        $msg = "💬 *NOVA OBSERVAÇÃO*\n\n📦 *Chamado:* #{$chamado->id_chamado}\n👤 *Enviado por:* {$user->ds_nome}\n\n🔗 *Confira em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";

        if ($chamado->id_usuario != $user->id_usuario) {
            $dono = \App\Models\User::find($chamado->id_usuario);
            if ($dono) { $dono->notify($notification); $whatsapp->notifyUser($dono, $msg); }
        }

        $tecnico = $chamado->tecnico;
        if ($tecnico && $tecnico->id_usuario != $user->id_usuario) {
            $tecnico->notify($notification); $whatsapp->notifyUser($tecnico, $msg);
        }
    }


    public function storeChatMessage(Request $request, $id)
    {
        $request->validate([
            'mensagem' => 'nullable|string',
            'arquivo' => 'nullable|file|max:5120', // 5MB
        ]);

        if (!$request->mensagem && !$request->hasFile('arquivo')) {
            return back()->with('error', 'Envie uma mensagem ou um arquivo.');
        }

        $chamado = Chamado::findOrFail($id);
        $user = auth()->user();

        // Verifica se o usuário é o solicitante ou o técnico responsável (via tabela pivot)
        $isSolicitante = $user->id_usuario == $chamado->id_usuario;
        $isTecnicoResponsavel = DB::table('rl_chamado_usuario')
            ->where('id_chamado', $id)
            ->where('id_usuario', $user->id_usuario)
            ->exists();

        if (!$isSolicitante && !$isTecnicoResponsavel) {
            abort(403, 'Acesso restrito ao chat.');
        }

        $caminhoArquivo = null;
        if ($request->hasFile('arquivo')) {
            $dataHoje = date('Y-m-d');
            $extensao = $request->file('arquivo')->getClientOriginalExtension();
            $nomeUnico = uniqid('chat_' . $id . '_', true) . '.' . $extensao;
            $caminhoArquivo = $request->file('arquivo')->storeAs("uploads/chat/{$dataHoje}/{$id}", $nomeUnico, 'public');
        }

        $chatMessage = ChatChamado::create([
            'id_chamado' => $id,
            'id_usuario' => $user->id_usuario,
            'ds_mensagem' => $request->mensagem,
            'ds_caminho_arquivo' => $caminhoArquivo,
            'dt_envio' => now()
        ]);

        // Notifica a outra parte (Dono ou Técnico)
        $textoMensagem = $request->mensagem ?: ( $request->hasFile('arquivo') ? "Enviou um arquivo" : "" );
        $notification = new \App\Notifications\NovoChat($chamado, $user, $textoMensagem);
        $whatsappService = app(\App\Services\EvolutionService::class);
        
        $resumoChat = mb_strimwidth($textoMensagem, 0, 100, "...");

        $msgWhatsAppChat = "✉️ *NOVA MENSAGEM NO CHAT*\n\n".
                           "📦 *Chamado:* #{$chamado->id_chamado}\n".
                           "👤 *De:* {$user->ds_nome}\n".
                           "💬 *Mensagem:* {$resumoChat}\n\n".
                           "🔗 *Responda em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";
        
        // Se quem enviou foi o técnico, notifica o dono
        if ($isTecnicoResponsavel && $chamado->id_usuario != $user->id_usuario) {
            $dono = \App\Models\User::find($chamado->id_usuario);
            if ($dono) {
                $dono->notify($notification);
                $whatsappService->notifyUser($dono, $msgWhatsAppChat);
            }
        } 
        // Se quem enviou foi o dono, notifica o técnico
        else if ($isSolicitante) {
            $tecnicoRel = \App\Models\RelacaoChamadoUsuario::where('id_chamado', $id)->first();
            if ($tecnicoRel && $tecnicoRel->id_usuario != $user->id_usuario) {
                $tecnicoNotif = \App\Models\User::find($tecnicoRel->id_usuario);
                if ($tecnicoNotif) {
                    $tecnicoNotif->notify($notification);
                    $whatsappService->notifyUser($tecnicoNotif, $msgWhatsAppChat);
                }
            }
        }

        return redirect()->back();
    }

    public function getChatMessages($id)
    {
        $chamado = Chamado::findOrFail($id);
        $user = auth()->user();

        // Verifica se o usuário é o solicitante ou o técnico responsável
        $isSolicitante = $user->id_usuario == $chamado->id_usuario;
        $isTecnicoResponsavel = DB::table('rl_chamado_usuario')
            ->where('id_chamado', $id)
            ->where('id_usuario', $user->id_usuario)
            ->exists();

        if (!$isSolicitante && !$isTecnicoResponsavel && !in_array($user->id_perfil, [1, 5])) {
            abort(403, 'Acesso restrito ao chat.');
        }

        $chat = ChatChamado::with('usuario:id_usuario,ds_nome,ds_foto')
            ->where('id_chamado', $id)
            ->orderBy('dt_envio', 'asc')
            ->get();

        return response()->json($chat);
    }

    public function markChatAsRead($id)
    {
        $user = auth()->user();
        
        // Marca como lidas as mensagens que NÃO foram enviadas pelo usuário logado
        ChatChamado::where('id_chamado', $id)
            ->where('id_usuario', '!=', $user->id_usuario)
            ->whereNull('dt_leitura')
            ->update(['dt_leitura' => now()]);

        return response()->json(['success' => true]);
    }

    // ==========================================
    // 7. ENDPOINTS DA API (SELECTS DINÂMICOS)
    // ==========================================
    public function getLocalizacoes(Request $request)
    {
        $id_usuario = auth()->user()->id_usuario;

        // Traz apenas as localizações daquela empresa específicas para o usuário logado
        $localizacoes = DB::table('tb_localizacao as l')
            ->join('rl_usuario_empresa_localizacao as rl', 'l.id_localizacao', '=', 'rl.id_localizacao')
            ->where('rl.id_usuario', $id_usuario)
            ->where('rl.id_empresa', $request->id_empresa)
            ->select('l.id_localizacao', 'l.ds_localizacao')
            ->distinct()
            ->orderBy('l.ds_localizacao', 'asc')
            ->get();

        return response()->json($localizacoes);
    }

    public function getMotivos(Request $request)
    {
        $motivos = MotivoPrincipal::where('id_tipo_chamado', $request->id_tipo_chamado)->get();
        return response()->json($motivos);
    }

    public function getDetalhesMotivo(Request $request)
    {
        $query = MotivoAssociado::where('id_motivo_principal', $request->id_motivo);

        if ($request->id_motivo == '6' && $request->has('id_empresa')) {
            $query->where('id_empresa', $request->id_empresa);
        }

        return response()->json($query->get());
    }
}
