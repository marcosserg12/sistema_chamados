<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Prazo de entrega definido (chamado antigo que não tinha) ou alterado
 * (sempre com justificativa). Vai para o dono e, se quem alterou não foi o
 * técnico responsável, para o técnico também.
 */
class PrazoAlterado extends Notification
{
    use Queueable;

    public function __construct(
        protected $chamado,
        protected $usuario,
        protected ?string $prazoAnterior,
        protected string $prazoNovo,
        protected ?string $justificativa,
    ) {
    }

    public function via($notifiable)
    {
        $prefs = $notifiable->preferencias ?? [];
        $channels = ['database', 'broadcast'];

        if (($prefs['canal_email'] ?? true) !== false) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    private function data(?string $data): string
    {
        return $data ? Carbon::parse($data)->format('d/m/Y') : '-';
    }

    public function toMail($notifiable)
    {
        $id = $this->chamado->id_chamado;
        $mail = (new MailMessage)
            ->subject(($this->prazoAnterior ? '📅 Prazo alterado' : '📅 Prazo definido') . " - Chamado #{$id}")
            ->greeting('Olá, ' . $notifiable->ds_nome)
            ->line("**Chamado:** #{$id} {$this->chamado->ds_titulo}");

        if ($this->prazoAnterior) {
            $mail->line('**Prazo anterior:** ' . $this->data($this->prazoAnterior))
                ->line('**Novo prazo:** ' . $this->data($this->prazoNovo))
                ->line('**Justificativa:** ' . $this->justificativa);
        } else {
            $mail->line('**Prazo de entrega:** ' . $this->data($this->prazoNovo));
        }

        return $mail
            ->line('**Por:** ' . $this->usuario->ds_nome)
            ->action('Ver Chamado', config('app.url') . "/chamados/{$id}");
    }

    public function toArray($notifiable)
    {
        $id = $this->chamado->id_chamado;

        $mensagem = $this->prazoAnterior
            ? "Chamado #{$id}: prazo alterado de {$this->data($this->prazoAnterior)} para {$this->data($this->prazoNovo)} por {$this->usuario->ds_nome}. Justificativa: {$this->justificativa}"
            : "Chamado #{$id}: prazo de entrega definido para {$this->data($this->prazoNovo)} por {$this->usuario->ds_nome}.";

        return [
            'id_chamado' => $id,
            'tipo' => 'prazo',
            'title' => $this->prazoAnterior ? '📅 Prazo alterado' : '📅 Prazo definido',
            'message' => $mensagem,
            'url' => "/chamados/{$id}",
        ];
    }
}
