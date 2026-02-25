<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NovoComentario extends Notification
{
    use Queueable;

    protected $chamado;
    protected $usuario;
    protected $comentario;

    public function __construct($chamado, $usuario, $comentario)
    {
        $this->chamado = $chamado;
        $this->usuario = $usuario;
        $this->comentario = $comentario;
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
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('💬 Nova Observação - Chamado #' . $this->chamado->id_chamado)
            ->greeting('Olá, ' . $notifiable->ds_nome)
            ->line('Há uma nova observação no chamado #' . $this->chamado->id_chamado)
            ->line('**Enviado por:** ' . $this->usuario->ds_nome)
            ->line('**Comentário:** ' . $this->comentario->ds_comentario)
            ->action('Responder no Chamado', config('app.url') . "/chamados/{$this->chamado->id_chamado}")
            ->line('Atenciosamente.');
    }

    public function toArray($notifiable)
    {
        return [
            'id_chamado' => $this->chamado->id_chamado,
            'title' => 'Novo Comentário',
            'message' => "{$this->usuario->ds_nome}: {$this->comentario->ds_comentario}",
            'url' => "/chamados/{$this->chamado->id_chamado}"
        ];
    }
}
