<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ChamadoCriado extends Notification implements ShouldBroadcast
{
    use Queueable;

    protected $chamado;

    public function __construct($chamado)
    {
        $this->chamado = $chamado;
    }

    public function via($notifiable)
    {
        $prefs = $notifiable->preferencias ?? [];
        $channels = ['database', 'broadcast'];

        // Só envia e-mail se o usuário tiver a preferência ativa (padrão é true)
        if (($prefs['canal_email'] ?? true) !== false) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('🔔 Novo Chamado Aberto - #' . $this->chamado->id_chamado)
            ->greeting('Olá, ' . $notifiable->ds_nome)
            ->line('Um novo chamado foi aberto no sistema e requer sua atenção.')
            ->line('**Título:** ' . $this->chamado->ds_titulo)
            ->line('**Empresa:** ' . ($this->chamado->empresa->ds_empresa ?? '-'))
            ->action('Visualizar Chamado', config('app.url') . "/chamados/{$this->chamado->id_chamado}")
            ->line('Obrigado por utilizar nosso sistema!');
    }

    public function toArray($notifiable)
    {
        return [
            'id_chamado' => $this->chamado->id_chamado,
            'title' => 'Novo Chamado Aberto',
            'message' => "O chamado #{$this->chamado->id_chamado} foi criado: {$this->chamado->ds_titulo}",
            'url' => "/chamados/{$this->chamado->id_chamado}"
        ];
    }
}
