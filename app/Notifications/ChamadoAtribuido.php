<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ChamadoAtribuido extends Notification
{
    use Queueable;

    protected $chamado;
    protected $admin;

    public function __construct($chamado, $admin)
    {
        $this->chamado = $chamado;
        $this->admin = $admin;
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
            ->subject('🛠️ Novo Chamado Atribuído a Você - #' . $this->chamado->id_chamado)
            ->greeting('Olá, ' . $notifiable->ds_nome)
            ->line('Você foi designado como responsável pelo chamado abaixo:')
            ->line('**Assunto:** ' . $this->chamado->ds_titulo)
            ->action('Acessar Chamado', config('app.url') . "/chamados/{$this->chamado->id_chamado}")
            ->line('Bom trabalho!');
    }

    public function toArray($notifiable)
    {
        return [
            'id_chamado' => $this->chamado->id_chamado,
            'title' => 'Novo Chamado Atribuído',
            'message' => "Você foi designado como responsável pelo chamado #{$this->chamado->id_chamado}.",
            'url' => "/chamados/{$this->chamado->id_chamado}"
        ];
    }
}
