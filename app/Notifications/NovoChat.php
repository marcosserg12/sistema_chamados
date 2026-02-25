<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NovoChat extends Notification
{
    use Queueable;

    protected $chamado;
    protected $usuarioRemetente;
    protected $mensagem;

    public function __construct($chamado, $usuarioRemetente, $mensagem = null)
    {
        $this->chamado = $chamado;
        $this->usuarioRemetente = $usuarioRemetente;
        $this->mensagem = $mensagem;
    }

    public function via($notifiable)
    {
        $prefs = $notifiable->preferencias ?? [];
        $channels = ['database'];

        if (($prefs['canal_email'] ?? true) !== false) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail($notifiable)
    {
        $texto = $this->mensagem ?: "enviou um arquivo.";
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('✉️ Nova Mensagem no Chat - Chamado #' . $this->chamado->id_chamado)
            ->greeting('Olá, ' . $notifiable->ds_nome)
            ->line('Você recebeu uma nova mensagem privada no chat do chamado #' . $this->chamado->id_chamado)
            ->line('**De:** ' . $this->usuarioRemetente->ds_nome)
            ->line('**Mensagem:** ' . $texto)
            ->action('Responder agora', config('app.url') . "/chamados/{$this->chamado->id_chamado}")
            ->line('Obrigado!');
    }

    public function toArray($notifiable)
    {
        $texto = $this->mensagem ? ": {$this->mensagem}" : "";
        return [
            'id_chamado' => $this->chamado->id_chamado,
            'title' => 'Nova Mensagem no Chat do chamado - ' . $this->chamado->id_chamado,
            'message' => "{$this->usuarioRemetente->ds_nome}{$texto}",
            'url' => "/chamados/{$this->chamado->id_chamado}"
        ];
    }
}
