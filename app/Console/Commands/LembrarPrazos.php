<?php

namespace App\Console\Commands;

use App\Services\LembretePrazoService;
use App\Support\PrazoChamado;
use App\Support\StatusChamado;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Lembrete diário de prazos (agendado seg–sex às 8h em routes/console.php).
 *
 *   php artisan chamados:lembrar-prazos --simular   # só mostra, não envia
 */
class LembrarPrazos extends Command
{
    protected $signature = 'chamados:lembrar-prazos
                            {--simular : Mostra quem receberia cada lembrete, sem enviar nada}';

    protected $description = 'Avisa técnicos e donos dos chamados que vencem hoje ou estão atrasados';

    public function handle(LembretePrazoService $lembretes): int
    {
        $simular = (bool) $this->option('simular');

        $resultado = $lembretes->executar($simular);

        $dia = Carbon::parse($resultado['data'])->format('d/m/Y');
        $this->info(($simular ? '[SIMULAÇÃO] ' : '') . "Lembretes de prazo de {$dia}: {$resultado['chamados']} chamado(s) vencendo hoje ou atrasado(s).");

        if (empty($resultado['envios'])) {
            $this->line('Ninguém para avisar.');

            return self::SUCCESS;
        }

        $linhas = [];
        foreach ($resultado['envios'] as $envio) {
            foreach ($envio['itens'] as $item) {
                $linhas[] = [
                    $envio['nome'],
                    $item['papel'] === 'tecnico' ? 'Técnico' : 'Dono',
                    "#{$item['id_chamado']} " . mb_strimwidth($item['ds_titulo'], 0, 40, '…'),
                    StatusChamado::label($item['st_status']),
                    PrazoChamado::texto($item['dt_prazo'], $item['st_status']),
                ];
            }
        }

        $this->table(['Quem recebe', 'Como', 'Chamado', 'Status', 'Prazo'], $linhas);

        $pessoas = count($resultado['envios']);
        $this->info($simular
            ? "Nada foi enviado. {$pessoas} pessoa(s) receberiam o resumo."
            : "Enviado para {$pessoas} pessoa(s).");

        return self::SUCCESS;
    }
}
