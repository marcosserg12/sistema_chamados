<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StatusAlterado extends Notification
{
    use Queueable;

    protected $chamado;
    protected $usuario;

    public function __construct($chamado, $usuario)
    {
        $this->chamado = $chamado;
        $this->usuario = $usuario;
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
        $statusMap = [0 => 'Aberto', 1 => 'Em Andamento', 9 => 'Resolvido'];
        $statusTxt = $statusMap[$this->chamado->st_status] ?? 'Alterado';

        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->subject('🔄 Status Alterado - Chamado #' . $this->chamado->id_chamado)
            ->greeting('Olá, ' . $notifiable->ds_nome)
            ->line('O status do seu chamado foi atualizado.')
            ->line('**Novo Status:** ' . $statusTxt)
            ->action('Ver Chamado', config('app.url') . "/chamados/{$this->chamado->id_chamado}")
            ->line('Obrigado!');
    }

    public function toArray($notifiable)
    {
        $statusMap = [
            0 => 'Aberto',
            1 => 'Em Andamento',
            9 => 'Resolvido'
        ];
        
        $statusTxt = $statusMap[$this->chamado->st_status] ?? 'Alterado';

        return [
            'id_chamado' => $this->chamado->id_chamado,
            'title' => 'Status Alterado',
            'message' => "O status do chamado #{$this->chamado->id_chamado} foi alterado para: {$statusTxt}.",
            'url' => "/chamados/{$this->chamado->id_chamado}"
        ];
    }
}
