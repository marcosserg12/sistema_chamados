<?php

namespace App\Services;

use App\Models\Chamado;
use App\Models\HistoricoPrazoChamado;
use App\Models\HistoricoStatusChamado;
use App\Models\ArquivoChamado;
use App\Models\User;
use App\Notifications\ChamadoCriado;
use App\Notifications\PrazoAlterado;
use App\Support\PrazoChamado;
use App\Support\StatusChamado;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
     * Linha "📅 Prazo: ..." do chamado, para as mensagens de WhatsApp.
     */
    public function linhaPrazo(Chamado $chamado): string
    {
        return PrazoChamado::linhaWhatsApp($chamado->dt_prazo, (int) $chamado->st_status);
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

        $msgWhatsApp = "🔔 *NOVO CHAMADO ABERTO*\n\n".
                       "🆔 *#{$chamado->id_chamado}*\n".
                       "📝 *Título:* {$chamado->ds_titulo}\n".
                       "🏢 *Empresa:* {$nomeEmpresa}\n".
                       "📍 *Local:* {$nomeLocal}\n".
                       $this->linhaPrazo($chamado) . "\n\n".
                       "🔗 *Acesse em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";

        foreach ($tecnicos as $tecnico) {
            $prefs = $tecnico->preferencias ?? [];
            if (($prefs['evt_novo_chamado'] ?? true) !== false) {
                $this->notificarComSeguranca($tecnico, new ChamadoCriado($chamado));
            }
            $this->whatsapp->notifyUser($tecnico, $msgWhatsApp);
        }

        $msgDono = "✅ *CHAMADO ABERTO COM SUCESSO*\n\n".
                   "Olá! Seu chamado *#{$chamado->id_chamado}* foi registrado.\n".
                   "📌 *Assunto:* {$chamado->ds_titulo}\n".
                   $this->linhaPrazo($chamado) . "\n\n".
                   "Você será notificado por aqui assim que um técnico assumir a solicitação, já com o prazo de entrega.";

        $this->whatsapp->notifyUser($user, $msgDono);
    }

    /**
     * Atualiza o status do chamado e dispara notificações.
     *
     * Se a mudança coloca o chamado nas mãos de um técnico (assumir um Aberto,
     * ou reabrir um Resolvido/Cancelado direto para um status pendente), o
     * prazo de entrega ($prazo, "Y-m-d") é obrigatório.
     */
    public function atualizarStatus(Chamado $chamado, int $novoStatus, User $user, ?string $prazo = null)
    {
        $statusAnterior = (int) $chamado->st_status;
        if ($statusAnterior === $novoStatus) return;

        $exigePrazo = PrazoChamado::exigePrazo($statusAnterior, $novoStatus);
        $novoPrazo = $exigePrazo ? $this->validarNovoPrazo($prazo) : null;

        DB::transaction(function () use ($chamado, $novoStatus, $user, $exigePrazo, $novoPrazo) {
            $chamado->st_status = $novoStatus;
            $chamado->save();

            HistoricoStatusChamado::create([
                'id_chamado' => $chamado->id_chamado,
                'id_usuario' => $user->id_usuario,
                'st_status' => $novoStatus,
                'dt_update' => now()
            ]);

            if ($exigePrazo) {
                $this->registrarPrazo($chamado, $novoPrazo, $user);
            } elseif ($novoStatus === StatusChamado::ABERTO && $chamado->dt_prazo) {
                // Reaberto: o prazo sai junto com o técnico; quem assumir de novo define outro.
                $this->registrarPrazo($chamado, null, $user);
            }

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
     * Atribui um técnico ao chamado.
     *
     * Atribuir um chamado Aberto faz ele ir para Em Andamento — e aí o prazo
     * de entrega ($prazo, "Y-m-d") é obrigatório.
     */
    public function atribuirTecnico(Chamado $chamado, int $idTecnico, User $user, $notificar = true, ?string $prazo = null)
    {
        $assumindo = (int) $chamado->st_status === StatusChamado::ABERTO;
        $novoPrazo = $assumindo ? $this->validarNovoPrazo($prazo) : null;

        DB::transaction(function () use ($chamado, $idTecnico, $user, $notificar, $assumindo, $novoPrazo) {
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

            if ($assumindo) {
                $chamado->st_status = StatusChamado::EM_ANDAMENTO;
                $chamado->save();

                HistoricoStatusChamado::create([
                    'id_chamado' => $chamado->id_chamado,
                    'id_usuario' => $user->id_usuario,
                    'st_status' => StatusChamado::EM_ANDAMENTO,
                    'dt_update' => now()
                ]);

                $this->registrarPrazo($chamado, $novoPrazo, $user);
            }

            if ($notificar) {
                $this->dispararNotificacaoAtribuicao($chamado, $idTecnico, $user);

                // O dono fica sabendo que o chamado foi assumido, e com qual prazo.
                if ($assumindo) {
                    $this->dispararNotificacaoStatus($chamado, $user, StatusChamado::EM_ANDAMENTO, false);
                }
            }
        });
    }

    /**
     * Só o técnico responsável e Administrador/Super Admin mexem no prazo.
     */
    public function podeAlterarPrazo(Chamado $chamado, $user): bool
    {
        if (!$user) {
            return false;
        }

        if (in_array((int) $user->id_perfil, [1, 5], true)) {
            return true;
        }

        return (int) $user->id_perfil === 4
            && $chamado->relacionamentoUsuarios()->where('id_usuario', $user->id_usuario)->exists();
    }

    /**
     * Define (chamado antigo sem prazo) ou altera o prazo de entrega. Alterar
     * um prazo que já existe exige justificativa — que vai para o histórico e
     * para a mensagem do dono.
     */
    public function alterarPrazo(Chamado $chamado, ?string $prazo, User $user, ?string $justificativa = null): void
    {
        if (!$this->podeAlterarPrazo($chamado, $user)) {
            throw new AuthorizationException('Só o técnico responsável ou um administrador pode alterar o prazo deste chamado.');
        }

        if (!in_array((int) $chamado->st_status, PrazoChamado::STATUS_COM_PRAZO, true)) {
            throw ValidationException::withMessages([
                'dt_prazo' => 'O prazo só pode ser definido em chamados Em Andamento, Pausados ou Aguardando Teste.',
            ]);
        }

        $novo = $this->validarNovoPrazo($prazo, 'Informe a nova data do prazo.');
        $anterior = $chamado->dt_prazo;
        $justificativa = trim((string) $justificativa);

        if ($anterior) {
            if ($anterior->isSameDay($novo)) {
                throw ValidationException::withMessages(['dt_prazo' => 'Escolha uma data diferente do prazo atual.']);
            }

            if (mb_strlen($justificativa) < PrazoChamado::MIN_JUSTIFICATIVA) {
                throw ValidationException::withMessages([
                    'ds_justificativa' => 'Explique o motivo da mudança de prazo (mínimo ' . PrazoChamado::MIN_JUSTIFICATIVA . ' caracteres).',
                ]);
            }
        }

        $justificativa = $anterior ? $justificativa : null;
        $prazoAnterior = $anterior?->toDateString();

        DB::transaction(function () use ($chamado, $novo, $user, $justificativa) {
            $this->registrarPrazo($chamado, $novo, $user, $justificativa);
        });

        $this->dispararNotificacaoPrazo($chamado, $user, $prazoAnterior, $novo->toDateString(), $justificativa);
    }

    /**
     * Valida a data do prazo ("Y-m-d", hoje ou depois).
     */
    private function validarNovoPrazo(?string $prazo, string $mensagemVazio = 'Informe o prazo de entrega para assumir o chamado.'): Carbon
    {
        $prazo = trim((string) $prazo);
        if ($prazo === '') {
            throw ValidationException::withMessages(['dt_prazo' => $mensagemVazio]);
        }

        try {
            $data = Carbon::createFromFormat('!Y-m-d', $prazo);
        } catch (\Throwable $e) {
            $data = null;
        }

        if (!$data || $data->format('Y-m-d') !== $prazo) {
            throw ValidationException::withMessages(['dt_prazo' => 'Data de prazo inválida.']);
        }

        if ($data->lt(Carbon::today())) {
            throw ValidationException::withMessages(['dt_prazo' => 'O prazo de entrega não pode ser uma data que já passou.']);
        }

        return $data;
    }

    /**
     * Grava o novo prazo (ou a remoção dele) no chamado e no histórico.
     */
    private function registrarPrazo(Chamado $chamado, ?Carbon $novo, User $user, ?string $justificativa = null): void
    {
        HistoricoPrazoChamado::create([
            'id_chamado' => $chamado->id_chamado,
            'id_usuario' => $user->id_usuario,
            'dt_prazo_anterior' => $chamado->dt_prazo?->toDateString(),
            'dt_prazo_novo' => $novo?->toDateString(),
            'ds_justificativa' => $justificativa,
            'dt_update' => now(),
        ]);

        $chamado->dt_prazo = $novo?->toDateString();
        $chamado->save();
    }

    private function dispararNotificacaoStatus(Chamado $chamado, User $user, $novoStatus, bool $notificarTecnico = true)
    {
        $statusTxt = StatusChamado::label($novoStatus);

        $msg = "🔄 *STATUS ATUALIZADO*\n\n".
               "O chamado *#{$chamado->id_chamado}* agora está como: *{$statusTxt}*.\n".
               "👤 *Atualizado por:* {$user->ds_nome}\n".
               $this->linhaPrazo($chamado) . "\n\n".
               "🔗 *Acompanhe em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";

        $notif = new \App\Notifications\StatusAlterado($chamado, $user);

        if ($chamado->id_usuario != $user->id_usuario) {
            $dono = User::find($chamado->id_usuario);
            if ($dono) {
                $this->notificarComSeguranca($dono, $notif);
                $this->whatsapp->notifyUser($dono, $msg);
            }
        }

        if (!$notificarTecnico) {
            return;
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
               "📌 *Assunto:* {$chamado->ds_titulo}\n".
               $this->linhaPrazo($chamado) . "\n\n".
               "🔗 *Acesse em:* " . config('app.url') . "/chamados/{$chamado->id_chamado}";

        $this->notificarComSeguranca($tecnico, new \App\Notifications\ChamadoAtribuido($chamado, $user));
        $this->whatsapp->notifyUser($tecnico, $msg);
    }

    /**
     * Prazo definido/alterado: avisa o dono e, se quem mexeu não foi o
     * técnico responsável (ex.: um admin), o técnico também.
     */
    private function dispararNotificacaoPrazo(Chamado $chamado, User $user, ?string $anterior, string $novo, ?string $justificativa): void
    {
        $fmt = fn ($d) => Carbon::parse($d)->format('d/m/Y');
        $link = config('app.url') . "/chamados/{$chamado->id_chamado}";

        $msg = $anterior
            ? "📅 *PRAZO ALTERADO*\n\n".
              "🆔 *#{$chamado->id_chamado}* {$chamado->ds_titulo}\n".
              "🗓️ *De:* {$fmt($anterior)} ➜ *Para:* {$fmt($novo)}\n".
              "📝 *Justificativa:* {$justificativa}\n".
              "👤 *Alterado por:* {$user->ds_nome}\n\n".
              "🔗 *Acompanhe em:* {$link}"
            : "📅 *PRAZO DEFINIDO*\n\n".
              "🆔 *#{$chamado->id_chamado}* {$chamado->ds_titulo}\n".
              "🗓️ *Prazo de entrega:* {$fmt($novo)}\n".
              "👤 *Definido por:* {$user->ds_nome}\n\n".
              "🔗 *Acompanhe em:* {$link}";

        $notif = new PrazoAlterado($chamado, $user, $anterior, $novo, $justificativa);

        $avisados = [$user->id_usuario];

        if (!in_array($chamado->id_usuario, $avisados)) {
            $dono = User::find($chamado->id_usuario);
            if ($dono) {
                $this->notificarComSeguranca($dono, $notif);
                $this->whatsapp->notifyUser($dono, $msg);
                $avisados[] = $dono->id_usuario;
            }
        }

        $idTecnico = $chamado->relacionamentoUsuarios()->value('id_usuario');
        if ($idTecnico && !in_array($idTecnico, $avisados)) {
            $tecnico = User::find($idTecnico);
            if ($tecnico) {
                $this->notificarComSeguranca($tecnico, $notif);
                $this->whatsapp->notifyUser($tecnico, $msg);
            }
        }
    }
}
