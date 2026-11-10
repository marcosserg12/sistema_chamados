<?php

namespace App\Notifications;

use App\Services\LembretePrazoService;
use App\Support\PrazoChamado;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Resumo diário de prazos por e-mail: um e-mail por pessoa com todos os
 * chamados dela que vencem hoje ou estão atrasados.
 */
class ResumoPrazos extends Notification
{
    use Queueable;

    /**
     * @param array $itens itens montados por LembretePrazoService::montarEnvios()
     */
    public function __construct(public array $itens)
    {
    }

    public function via($notifiable)
    {
        $prefs = $notifiable->preferencias ?? [];

        return ($prefs['canal_email'] ?? true) !== false ? ['mail'] : [];
    }

    public function toMail($notifiable)
    {
        $vencemHoje = array_filter($this->itens, fn ($i) => $i['situacao'] === PrazoChamado::VENCE_HOJE);
        $atrasados = array_filter($this->itens, fn ($i) => $i['situacao'] === PrazoChamado::ATRASADO);

        $mail = (new MailMessage)
            ->subject('⏰ Lembrete de prazos — ' . count($this->itens) . ' chamado(s)')
            ->greeting('Olá, ' . $notifiable->ds_nome);

        if ($vencemHoje) {
            $mail->line('**Vencem hoje:**');
            foreach ($vencemHoje as $item) {
                $mail->line($this->linha($item));
            }
        }

        if ($atrasados) {
            $mail->line('**Em atraso:**');
            foreach ($atrasados as $item) {
                $mail->line($this->linha($item));
            }
        }

        $url = count($this->itens) === 1
            ? config('app.url') . '/chamados/' . reset($this->itens)['id_chamado']
            : config('app.url') . '/chamados';

        $mail->action(count($this->itens) === 1 ? 'Abrir chamado' : 'Abrir chamados', $url);

        if (collect($this->itens)->contains('papel', 'tecnico')) {
            $mail->line('Finalize o chamado ou altere o prazo no sistema, informando uma justificativa.');
        }

        return $mail;
    }

    private function linha(array $item): string
    {
        $linha = "#{$item['id_chamado']} {$item['ds_titulo']} — prazo " . PrazoChamado::texto($item['dt_prazo'], (int) $item['st_status']);

        if ($item['papel'] === 'dono') {
            $linha .= ' — ' . LembretePrazoService::contextoParaODono((int) $item['st_status']);
        }

        return $linha;
    }
}
