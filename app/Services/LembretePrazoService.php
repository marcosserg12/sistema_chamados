<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\PrazoLembrete;
use App\Notifications\ResumoPrazos;
use App\Support\PrazoChamado;
use App\Support\StatusChamado;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Lembretes diários de prazo (comando chamados:lembrar-prazos, seg–sex 8h).
 *
 * Quem recebe o quê segue PrazoChamado::destinatarios(). No sino cada chamado
 * vira uma notificação própria; no WhatsApp e no e-mail cada pessoa recebe um
 * resumo só, com todos os chamados dela.
 */
class LembretePrazoService
{
    public function __construct(
        protected ChamadoService $chamados,
        protected EvolutionService $whatsapp,
    ) {}

    /**
     * Roda os lembretes do dia. Com $simular = true só monta e devolve o que
     * seria enviado, sem enviar nada nem marcar os chamados.
     */
    public function executar(bool $simular = false, ?CarbonInterface $hoje = null): array
    {
        $hoje = ($hoje ? Carbon::instance($hoje) : Carbon::today())->copy()->startOfDay();

        $chamados = $this->buscarChamados($hoje);
        $envios = self::montarEnvios($chamados, $hoje);

        $usuarios = User::whereIn('id_usuario', array_keys($envios))
            ->where('st_ativo', 'A')
            ->get()
            ->keyBy('id_usuario');

        $relatorio = [];
        foreach ($envios as $idUsuario => $itens) {
            $usuario = $usuarios->get($idUsuario);

            $relatorio[] = [
                'id_usuario' => $idUsuario,
                'nome' => $usuario?->ds_nome ?? "Usuário #{$idUsuario} (inativo ou não encontrado)",
                'itens' => $itens,
                'enviado' => !$simular && $usuario !== null,
            ];

            if (!$simular && $usuario) {
                $this->enviar($usuario, $itens);
            }
        }

        // Marca o dia nos chamados processados, para o comando não repetir
        // lembrete se rodar de novo hoje. DB::table para não mexer no dt_update.
        if (!$simular && $chamados->isNotEmpty()) {
            DB::table('tb_chamados')
                ->whereIn('id_chamado', $chamados->pluck('id_chamado')->unique()->all())
                ->update(['dt_lembrete_prazo' => $hoje->toDateString()]);
        }

        return [
            'data' => $hoje->toDateString(),
            'chamados' => $chamados->pluck('id_chamado')->unique()->count(),
            'envios' => $relatorio,
        ];
    }

    /**
     * Chamados pendentes que vencem hoje ou já venceram e ainda não entraram
     * no lembrete de hoje.
     */
    protected function buscarChamados(Carbon $hoje): Collection
    {
        $dia = $hoje->toDateString();

        return DB::table('tb_chamados as c')
            ->leftJoin('rl_chamado_usuario as rl', 'rl.id_chamado', '=', 'c.id_chamado')
            ->whereIn('c.st_status', PrazoChamado::STATUS_COM_PRAZO)
            ->whereNotNull('c.dt_prazo')
            ->where('c.dt_prazo', '<=', $dia)
            ->where(function ($q) use ($dia) {
                $q->whereNull('c.dt_lembrete_prazo')->orWhere('c.dt_lembrete_prazo', '<', $dia);
            })
            ->orderBy('c.dt_prazo')
            ->orderBy('c.id_chamado')
            ->get([
                'c.id_chamado',
                'c.ds_titulo',
                'c.st_status',
                'c.dt_prazo',
                'rl.id_usuario as id_tecnico',
                'c.id_usuario as id_dono',
            ])
            ->map(fn ($c) => (array) $c);
    }

    /**
     * Agrupa os lembretes por pessoa. Recebe chamados como arrays com
     * id_chamado, ds_titulo, st_status, dt_prazo, id_tecnico e id_dono e
     * devolve [id_usuario => [item, ...]], onde cada item é o chamado mais
     * 'situacao' (vence_hoje/atrasado) e 'papel' (tecnico/dono).
     */
    public static function montarEnvios(iterable $chamados, CarbonInterface $hoje): array
    {
        $envios = [];

        foreach ($chamados as $chamado) {
            $chamado = (array) $chamado;
            $status = (int) $chamado['st_status'];
            $situacao = PrazoChamado::situacao($chamado['dt_prazo'], $status, $hoje);

            foreach (PrazoChamado::destinatarios($status, $situacao) as $papel) {
                $idUsuario = $papel === 'tecnico' ? $chamado['id_tecnico'] : $chamado['id_dono'];
                if (!$idUsuario) {
                    continue;
                }
                $idUsuario = (int) $idUsuario;

                // Quem é técnico e dono do mesmo chamado recebe uma vez só (como técnico).
                $jaTem = collect($envios[$idUsuario] ?? [])->contains('id_chamado', (int) $chamado['id_chamado']);
                if ($jaTem) {
                    continue;
                }

                $envios[$idUsuario][] = [
                    'id_chamado' => (int) $chamado['id_chamado'],
                    'ds_titulo' => (string) $chamado['ds_titulo'],
                    'st_status' => $status,
                    'dt_prazo' => substr((string) $chamado['dt_prazo'], 0, 10),
                    'situacao' => $situacao,
                    'papel' => $papel,
                ];
            }
        }

        return $envios;
    }

    /**
     * Texto do resumo diário no WhatsApp para uma pessoa.
     */
    public static function mensagemWhatsApp(string $nome, array $itens, string $urlBase): string
    {
        $urlBase = rtrim($urlBase, '/');
        $primeiroNome = mb_convert_case(mb_strtolower(strtok(trim($nome), ' ') ?: $nome), MB_CASE_TITLE);

        $vencemHoje = array_values(array_filter($itens, fn ($i) => $i['situacao'] === PrazoChamado::VENCE_HOJE));
        $atrasados = array_values(array_filter($itens, fn ($i) => $i['situacao'] === PrazoChamado::ATRASADO));

        $linhas = ["⏰ *LEMBRETE DE PRAZOS*", '', "Olá, {$primeiroNome}!"];

        if ($vencemHoje) {
            $linhas[] = '';
            $linhas[] = '📅 *Vencem hoje:*';
            foreach ($vencemHoje as $item) {
                array_push($linhas, ...self::linhasDoItem($item, $urlBase, false));
            }
        }

        if ($atrasados) {
            $linhas[] = '';
            $linhas[] = '🚨 *Em atraso:*';
            foreach ($atrasados as $item) {
                array_push($linhas, ...self::linhasDoItem($item, $urlBase, true));
            }
        }

        if (collect($itens)->contains('papel', 'tecnico')) {
            $linhas[] = '';
            $linhas[] = '👉 Finalize o chamado ou altere o prazo no sistema, informando uma justificativa.';
        }

        return implode("\n", $linhas);
    }

    private static function linhasDoItem(array $item, string $urlBase, bool $comPrazo): array
    {
        $linha = "• *#{$item['id_chamado']}* {$item['ds_titulo']}";
        if ($comPrazo) {
            $linha .= ' — prazo ' . PrazoChamado::texto($item['dt_prazo'], $item['st_status']);
        }

        $linhas = [$linha];

        if ($item['papel'] === 'dono') {
            $linhas[] = '   ' . self::contextoParaODono($item['st_status']);
        }

        $linhas[] = "   🔗 {$urlBase}/chamados/{$item['id_chamado']}";

        return $linhas;
    }

    /**
     * O que o dono precisa saber sobre o chamado dele.
     */
    public static function contextoParaODono(int $status): string
    {
        return match ($status) {
            StatusChamado::AGUARDANDO_TESTE => '🧪 Aguardando o seu teste: teste e responda ao técnico pelo chat do chamado.',
            StatusChamado::PAUSADO => '⏸️ Pausado/Aguardando Peça.',
            default => '🔧 Em andamento com o técnico.',
        };
    }

    protected function enviar(User $usuario, array $itens): void
    {
        foreach ($itens as $item) {
            $this->chamados->notificarComSeguranca($usuario, new PrazoLembrete($item));
        }

        try {
            $this->whatsapp->notifyUser($usuario, self::mensagemWhatsApp($usuario->ds_nome ?? '', $itens, (string) config('app.url')));
        } catch (\Throwable $e) {
            Log::warning('Falha ao enviar lembrete de prazo por WhatsApp: ' . $e->getMessage(), ['id_usuario' => $usuario->id_usuario]);
        }

        $this->chamados->notificarComSeguranca($usuario, new ResumoPrazos($itens));
    }
}
