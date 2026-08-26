<?php

namespace App\Services;

use App\Models\Chamado;
use App\Models\HistoricoStatusChamado;
use App\Models\ArquivoChamado;
use App\Models\User;
use App\Notifications\ChamadoCriado;
use App\Support\StatusChamado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ChamadoService
{
    protected $whatsapp;

    public function __construct(EvolutionService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    /**
     * Cria um novo chamado com anexos e notificações
     */
    public function criarChamado(array $data, User $user, $arquivos = [])
    {
        return DB::transaction(function () use ($data, $user, $arquivos) {
            // 1. Criar Chamado
            $chamado = Chamado::create([
                'id_usuario' => $user->id_usuario,
                'ds_titulo' => $data['ds_titulo'],
                'ds_descricao' => $data['ds_descricao'],
                'id_empresa' => $data['id_empresa'],
                'id_localizacao' => $data['id_localizacao'],
                'id_tipo_chamado' => $data['id_tipo_chamado'],
                'id_motivo_principal' => $data['id_motivo_principal'],
                'id_motivo_associado' => $data['id_motivo_associado'],
                'st_grau' => $data['st_grau'] ?? null,
                'ds_patrimonio' => $data['ds_patrimonio'] ?? null,
                'st_status' => 0,
                'dt_data_chamado' => now(),
                'dt_update' => now()
            ]);

            // 2. Histórico Inicial
            HistoricoStatusChamado::create([
                'id_chamado' => $chamado->id_chamado,
                'id_usuario' => $user->id_usuario,
                'st_status' => 0,
                'dt_update' => now()
            ]);

            // 3. Processar Anexos
            if (!empty($arquivos)) {
                $this->uploadArquivos($chamado, $arquivos);
            }

            // 4. Notificar Equipe e Solicitante
            $this->dispararNotificacoesCriacao($chamado, $user);

            return $chamado;
        });
    }

    /**
     * Envia uma notificação sem deixar uma falha de infraestrutura (broadcast/
     * mail fora do ar, etc.) derrubar a operação principal (criar chamado,
     * mudar status, atribuir técnico). A notificação é best-effort: se falhar,
     * só registra no log.
     */
    public function notificarComSeguranca($notifiable, $notification): void
    {
        try {
            $notifiable->notify($notification);
        } catch (\Throwable $e) {
            Log::warning('Falha ao enviar notificação: ' . $e->getMessage(), [
                'notification' => get_class($notification),
                'notifiable_id' => $notifiable->id_usuario ?? null,
            ]);
        }
    }

    /**
     * Gerencia o upload de arquivos
     */
    public function uploadArquivos(Chamado $chamado, array $arquivos)
    {
        $dataHoje = date('Y-m-d');
        foreach ($arquivos as $file) {
            $extensao = $file->getClientOriginalExtension();
            $nomeUnico = uniqid('chamado_' . $chamado->id_chamado . '_', true) . '.' . $extensao;
            $caminhoBanco = "{$dataHoje}/{$chamado->id_chamado}/{$nomeUnico}";

            $file->storeAs("uploads/{$dataHoje}/{$chamado->id_chamado}", $nomeUnico, 'public');

            ArquivoChamado::create([
                'id_chamado' => $chamado->id_chamado,
                'ds_caminho_arquivo' => $caminhoBanco
            ]);
        }
    }

    /**
     * Dispara notificações para técnicos e confirmação para o usuário
     */
    private function dispararNotificacoesCriacao(Chamado $chamado, User $user)
    {
        $idTipoInfra = 1;
        $idTecnicoInfra = 41;

        $queryEquipe = User::whereIn('id_perfil', [4])
            ->where('st_ativo', 'A')
            ->where('id_usuario', '!=', $user->id_usuario);

        if ($chamado->id_tipo_chamado == $idTipoInfra) {
            $tecnicos = $queryEquipe->where('id_usuario', $idTecnicoInfra)->get();
        } else {
            $tecnicos = $queryEquipe->where('id_usuario', '!=', $idTecnicoInfra)->get();
        }

        $nomeEmpresa = $chamado->empresa->ds_empresa ?? '-';
        $nomeLocal = $chamado->localizacao->ds_localizacao ?? '-';

        $msgWhatsApp = "🔔 *NOVO CHAMADO ABERTO*

".
                       "🆔 *#{$chamado->id_chamado}*
".
                       "📝 *Título:* {$chamado->ds_titulo}
".
                       "🏢 *Empresa:* {$nomeEmpresa}
".
                       "📍 *Local:* {$nomeLocal}

".
                       "🔗 *Acesse em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";

        foreach ($tecnicos as $tecnico) {
            $prefs = $tecnico->preferencias ?? [];
            if (($prefs['evt_novo_chamado'] ?? true) !== false) {
                $this->notificarComSeguranca($tecnico, new ChamadoCriado($chamado));
            }
            $this->whatsapp->notifyUser($tecnico, $msgWhatsApp);
        }

        $msgDono = "✅ *CHAMADO ABERTO COM SUCESSO*

".
                   "Olá! Seu chamado *#{$chamado->id_chamado}* foi registrado.
".
                   "📌 *Assunto:* {$chamado->ds_titulo}

".
                   "Você será notificado por aqui assim que um técnico assumir a solicitação.";
        
        $this->whatsapp->notifyUser($user, $msgDono);
    }

    /**
     * Atualiza o status do chamado e dispara notificações
     */
    public function atualizarStatus(Chamado $chamado, int $novoStatus, User $user)
    {
        if ($chamado->st_status == $novoStatus) return;

        DB::transaction(function () use ($chamado, $novoStatus, $user) {
            $chamado->st_status = $novoStatus;
            $chamado->save();

            HistoricoStatusChamado::create([
                'id_chamado' => $chamado->id_chamado,
                'id_usuario' => $user->id_usuario,
                'st_status' => $novoStatus,
                'dt_update' => now()
            ]);

            // Se mudou para EM ANDAMENTO (1): assume a responsabilidade automaticamente
            if ($novoStatus == 1) {
                $this->atribuirTecnico($chamado, $user->id_usuario, $user, false);
            }
            // Se mudou para ABERTO (0): retira o técnico responsável
            else if ($novoStatus == 0) {
                $chamado->relacionamentoUsuarios()->delete();
                \App\Models\HistoricoUsuarioChamado::create([
                    'id_chamado' => $chamado->id_chamado,
                    'id_usuario_adm' => $user->id_usuario,
                    'id_usuario_desginado' => null,
                    'dt_update' => now()
                ]);
            }
            // Qualquer outro status (Resolvido, Aguardando Teste, Pausado, Cancelado):
            // se ninguém pegou o chamado ainda, quem mudou o status agora vira o
            // responsável — senão o chamado fica "resolvido" mas sem técnico
            // registrado, mesmo quem foi que resolveu direto do Aberto.
            else if (!$chamado->relacionamentoUsuarios()->exists()) {
                $this->atribuirTecnico($chamado, $user->id_usuario, $user, false);
            }

            $this->dispararNotificacaoStatus($chamado, $user, $novoStatus);
        });
    }

    /**
     * Atribui um técnico ao chamado
     */
    public function atribuirTecnico(Chamado $chamado, int $idTecnico, User $user, $notificar = true)
    {
        DB::transaction(function () use ($chamado, $idTecnico, $user, $notificar) {
            $chamado->relacionamentoUsuarios()->delete();
            \App\Models\RelacaoChamadoUsuario::create([
                'id_chamado' => $chamado->id_chamado,
                'id_usuario' => $idTecnico,
                'dt_aceito' => now()
            ]);

            \App\Models\HistoricoUsuarioChamado::create([
                'id_chamado' => $chamado->id_chamado,
                'id_usuario_adm' => $user->id_usuario,
                'id_usuario_desginado' => $idTecnico,
                'dt_update' => now()
            ]);

            if ($notificar) {
                $this->dispararNotificacaoAtribuicao($chamado, $idTecnico, $user);
            }

            if ($chamado->st_status == 0) {
                $chamado->st_status = 1;
                $chamado->save();
            }
        });
    }

    private function dispararNotificacaoStatus(Chamado $chamado, User $user, $novoStatus)
    {
        $statusTxt = StatusChamado::label($novoStatus);
        
        $msg = "🔄 *STATUS ATUALIZADO*\n\n".
               "O chamado *#{$chamado->id_chamado}* agora está como: *{$statusTxt}*.\n".
               "👤 *Atualizado por:* {$user->ds_nome}\n\n".
               "🔗 *Acompanhe em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";

        $notif = new \App\Notifications\StatusAlterado($chamado, $user);

        if ($chamado->id_usuario != $user->id_usuario) {
            $dono = User::find($chamado->id_usuario);
            if ($dono) {
                $this->notificarComSeguranca($dono, $notif);
                $this->whatsapp->notifyUser($dono, $msg);
            }
        }

        $tecnico = $chamado->tecnico;
        if ($tecnico && $tecnico->id_usuario != $user->id_usuario) {
            $this->notificarComSeguranca($tecnico, $notif);
            $this->whatsapp->notifyUser($tecnico, $msg);
        }
    }

    private function dispararNotificacaoAtribuicao(Chamado $chamado, int $idTecnico, User $user)
    {
        $tecnico = User::find($idTecnico);
        if (!$tecnico) return;

        $msg = "🛠️ *CHAMADO ATRIBUÍDO A VOCÊ*\n\n".
               "Você foi designado para o chamado *#{$chamado->id_chamado}*.\n".
               "📌 *Assunto:* {$chamado->ds_titulo}\n\n".
               "🔗 *Acesse em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";

        $this->notificarComSeguranca($tecnico, new \App\Notifications\ChamadoAtribuido($chamado, $user));
        $this->whatsapp->notifyUser($tecnico, $msg);
    }
}
