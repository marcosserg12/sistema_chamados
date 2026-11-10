<?php

namespace Tests\Unit;

use App\Services\LembretePrazoService;
use App\Support\PrazoChamado;
use App\Support\StatusChamado;
use Carbon\Carbon;
use Tests\TestCase;

class LembretePrazoTest extends TestCase
{
    private Carbon $hoje;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hoje = Carbon::parse('2026-11-11');
        Carbon::setTestNow(Carbon::parse('2026-11-11 08:00:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function chamado(int $id, int $status, string $prazo, ?int $tecnico = 10, int $dono = 20): array
    {
        return [
            'id_chamado' => $id,
            'ds_titulo' => "Chamado {$id}",
            'st_status' => $status,
            'dt_prazo' => $prazo,
            'id_tecnico' => $tecnico,
            'id_dono' => $dono,
        ];
    }

    public function test_agrupa_os_lembretes_por_pessoa_seguindo_a_tabela(): void
    {
        $envios = LembretePrazoService::montarEnvios([
            $this->chamado(1, StatusChamado::EM_ANDAMENTO, '2026-11-11'),      // vence hoje: técnico + dono
            $this->chamado(2, StatusChamado::EM_ANDAMENTO, '2026-11-09'),      // atrasado: só técnico
            $this->chamado(3, StatusChamado::PAUSADO, '2026-11-10', 10, 30),   // atrasado pausado: só dono (30)
        ], $this->hoje);

        $this->assertSame([1, 2], array_column($envios[10], 'id_chamado'));
        $this->assertSame([1], array_column($envios[20], 'id_chamado'));
        $this->assertSame([3], array_column($envios[30], 'id_chamado'));
    }

    public function test_cada_item_diz_a_situacao_e_o_papel_da_pessoa(): void
    {
        $envios = LembretePrazoService::montarEnvios([
            $this->chamado(1, StatusChamado::EM_ANDAMENTO, '2026-11-11'),
        ], $this->hoje);

        $this->assertSame(PrazoChamado::VENCE_HOJE, $envios[10][0]['situacao']);
        $this->assertSame('tecnico', $envios[10][0]['papel']);
        $this->assertSame('dono', $envios[20][0]['papel']);
    }

    public function test_quem_e_tecnico_e_dono_do_mesmo_chamado_recebe_uma_vez(): void
    {
        $envios = LembretePrazoService::montarEnvios([
            $this->chamado(1, StatusChamado::EM_ANDAMENTO, '2026-11-11', 10, 10),
        ], $this->hoje);

        $this->assertCount(1, $envios[10]);
        $this->assertSame('tecnico', $envios[10][0]['papel']);
    }

    public function test_chamado_sem_tecnico_nao_quebra_e_nao_gera_envio_para_ninguem_alem_do_dono(): void
    {
        $envios = LembretePrazoService::montarEnvios([
            $this->chamado(1, StatusChamado::EM_ANDAMENTO, '2026-11-11', null, 20),
            $this->chamado(2, StatusChamado::EM_ANDAMENTO, '2026-11-09', null, 20), // atrasado sem técnico: ninguém
        ], $this->hoje);

        $this->assertSame([20], array_keys($envios));
        $this->assertSame([1], array_column($envios[20], 'id_chamado'));
    }

    public function test_ignora_chamados_no_prazo_e_encerrados(): void
    {
        $envios = LembretePrazoService::montarEnvios([
            $this->chamado(1, StatusChamado::EM_ANDAMENTO, '2026-11-20'),
            $this->chamado(2, StatusChamado::RESOLVIDO, '2026-11-01'),
        ], $this->hoje);

        $this->assertSame([], $envios);
    }

    public function test_resumo_do_whatsapp_separa_vencem_hoje_e_atrasados(): void
    {
        $envios = LembretePrazoService::montarEnvios([
            $this->chamado(1, StatusChamado::EM_ANDAMENTO, '2026-11-11'),
            $this->chamado(2, StatusChamado::EM_ANDAMENTO, '2026-11-08'),
        ], $this->hoje);

        $texto = LembretePrazoService::mensagemWhatsApp('Marcos Sergio', $envios[10], 'https://chamados.test');

        $this->assertStringContainsString('LEMBRETE DE PRAZOS', $texto);
        $this->assertStringContainsString('Olá, Marcos!', $texto);
        $this->assertStringContainsString('*Vencem hoje:*', $texto);
        $this->assertStringContainsString('*#1* Chamado 1', $texto);
        $this->assertStringContainsString('*Em atraso:*', $texto);
        $this->assertStringContainsString('*#2* Chamado 2 — prazo 08/11/2026 (atrasado há 3 dias)', $texto);
        $this->assertStringContainsString('https://chamados.test/chamados/2', $texto);
        $this->assertTrue(
            strpos($texto, 'Vencem hoje') < strpos($texto, 'Em atraso'),
            'Os que vencem hoje vêm antes dos atrasados'
        );
    }

    public function test_resumo_do_dono_explica_o_status_de_quem_espera_por_ele(): void
    {
        $envios = LembretePrazoService::montarEnvios([
            $this->chamado(5, StatusChamado::AGUARDANDO_TESTE, '2026-11-10', 10, 30),
        ], $this->hoje);

        $texto = LembretePrazoService::mensagemWhatsApp('Ana', $envios[30], 'https://chamados.test');

        $this->assertStringContainsString('Aguardando o seu teste', $texto);
        $this->assertStringNotContainsString('*Vencem hoje:*', $texto);
    }
}
