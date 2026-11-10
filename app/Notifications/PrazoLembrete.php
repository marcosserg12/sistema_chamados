<?php

namespace App\Notifications;

use App\Support\PrazoChamado;
use App\Support\StatusChamado;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Lembrete diário de prazo de UM chamado, para o sino (banco + tempo real).
 * O e-mail e o WhatsApp vão em resumo (ResumoPrazos / LembretePrazoService).
 */
class PrazoLembrete extends Notification
{
    use Queueable;

    /**
     * @param array $item id_chamado, ds_titulo, st_status, dt_prazo, situacao, papel
     */
    public function __construct(public array $item)
    {
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        $id = $this->item['id_chamado'];
        $status = (int) $this->item['st_status'];
        $venceHoje = $this->item['situacao'] === PrazoChamado::VENCE_HOJE;

        $mensagem = "#{$id} {$this->item['ds_titulo']} — prazo " . PrazoChamado::texto($this->item['dt_prazo'], $status) . '.';

        if ($this->item['papel'] === 'tecnico') {
            $mensagem .= $venceHoje
                ? ' Finalize hoje ou altere o prazo com justificativa.'
                : ' Finalize ou altere o prazo com justificativa.';
        } elseif ($status === StatusChamado::AGUARDANDO_TESTE) {
            $mensagem .= ' O chamado está aguardando o seu teste.';
        } elseif ($status === StatusChamado::PAUSADO) {
            $mensagem .= ' O chamado está pausado/aguardando peça.';
        }

        return [
            'id_chamado' => $id,
            'tipo' => 'prazo',
            'title' => $venceHoje ? '⏰ Prazo vence hoje' : '🚨 Chamado em atraso',
            'message' => $mensagem,
            'url' => "/chamados/{$id}",
        ];
    }
}
