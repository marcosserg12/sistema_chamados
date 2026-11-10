<?php

namespace Tests\Unit;

use App\Support\PrazoChamado;
use App\Support\StatusChamado;
use Carbon\Carbon;
use Tests\TestCase;

class PrazoChamadoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Uma quarta-feira qualquer, no meio do expediente.
        Carbon::setTestNow(Carbon::parse('2026-11-11 10:30:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    // ---------------------------------------------------------------
    // Quando a mudança de status exige prazo
    // ---------------------------------------------------------------

    public function test_assumir_chamado_aberto_exige_prazo(): void
    {
        $this->assertTrue(PrazoChamado::exigePrazo(StatusChamado::ABERTO, StatusChamado::EM_ANDAMENTO));
        $this->assertTrue(PrazoChamado::exigePrazo(StatusChamado::ABERTO, StatusChamado::PAUSADO));
        $this->assertTrue(PrazoChamado::exigePrazo(StatusChamado::ABERTO, StatusChamado::AGUARDANDO_TESTE));
    }

    public function test_reabrir_chamado_encerrado_para_status_pendente_exige_prazo(): void
    {
        $this->assertTrue(PrazoChamado::exigePrazo(StatusChamado::RESOLVIDO, StatusChamado::EM_ANDAMENTO));
        $this->assertTrue(PrazoChamado::exigePrazo(StatusChamado::CANCELADO, StatusChamado::PAUSADO));
    }

    public function test_resolver_ou_cancelar_direto_do_aberto_nao_exige_prazo(): void
    {
        $this->assertFalse(PrazoChamado::exigePrazo(StatusChamado::ABERTO, StatusChamado::RESOLVIDO));
        $this->assertFalse(PrazoChamado::exigePrazo(StatusChamado::ABERTO, StatusChamado::CANCELADO));
    }

    public function test_mudar_entre_status_pendentes_nao_exige_prazo(): void
    {
        // Chamados antigos sem prazo "ficam como estão" ao trocar entre pendentes.
        $this->assertFalse(PrazoChamado::exigePrazo(StatusChamado::EM_ANDAMENTO, StatusChamado::PAUSADO));
        $this->assertFalse(PrazoChamado::exigePrazo(StatusChamado::PAUSADO, StatusChamado::EM_ANDAMENTO));
        $this->assertFalse(PrazoChamado::exigePrazo(StatusChamado::AGUARDANDO_TESTE, StatusChamado::EM_ANDAMENTO));
    }

    public function test_voltar_para_aberto_nao_exige_prazo(): void
    {
        $this->assertFalse(PrazoChamado::exigePrazo(StatusChamado::EM_ANDAMENTO, StatusChamado::ABERTO));
    }

    // ---------------------------------------------------------------
    // Situação do prazo
    // ---------------------------------------------------------------

    public function test_chamado_aberto_tem_prazo_a_definir(): void
    {
        $this->assertSame(PrazoChamado::A_DEFINIR, PrazoChamado::situacao(null, StatusChamado::ABERTO));
    }

    public function test_chamado_pendente_sem_prazo_e_sem_prazo(): void
    {
        $this->assertSame(PrazoChamado::SEM_PRAZO, PrazoChamado::situacao(null, StatusChamado::EM_ANDAMENTO));
        $this->assertSame(PrazoChamado::SEM_PRAZO, PrazoChamado::situacao(null, StatusChamado::PAUSADO));
    }

    public function test_prazo_futuro_esta_no_prazo(): void
    {
        $this->assertSame(PrazoChamado::NO_PRAZO, PrazoChamado::situacao('2026-11-12', StatusChamado::EM_ANDAMENTO));
    }

    public function test_prazo_de_hoje_vence_hoje_mesmo_no_fim_do_dia(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-11 23:59:00'));

        $this->assertSame(PrazoChamado::VENCE_HOJE, PrazoChamado::situacao('2026-11-11', StatusChamado::EM_ANDAMENTO));
    }

    public function test_prazo_de_ontem_esta_atrasado_logo_depois_da_meia_noite(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-12 00:01:00'));

        $this->assertSame(PrazoChamado::ATRASADO, PrazoChamado::situacao('2026-11-11', StatusChamado::EM_ANDAMENTO));
    }

    public function test_pausado_e_aguardando_teste_com_prazo_vencido_estao_atrasados(): void
    {
        $this->assertSame(PrazoChamado::ATRASADO, PrazoChamado::situacao('2026-11-10', StatusChamado::PAUSADO));
        $this->assertSame(PrazoChamado::ATRASADO, PrazoChamado::situacao('2026-11-10', StatusChamado::AGUARDANDO_TESTE));
    }

    public function test_chamado_encerrado_nunca_fica_atrasado(): void
    {
        $this->assertSame(PrazoChamado::ENCERRADO, PrazoChamado::situacao('2026-11-01', StatusChamado::RESOLVIDO));
        $this->assertSame(PrazoChamado::ENCERRADO, PrazoChamado::situacao(null, StatusChamado::CANCELADO));
    }

    public function test_aceita_prazo_como_carbon_ou_data_com_hora(): void
    {
        $this->assertSame(PrazoChamado::VENCE_HOJE, PrazoChamado::situacao(Carbon::parse('2026-11-11'), StatusChamado::EM_ANDAMENTO));
        $this->assertSame(PrazoChamado::VENCE_HOJE, PrazoChamado::situacao('2026-11-11 00:00:00', StatusChamado::EM_ANDAMENTO));
    }

    // ---------------------------------------------------------------
    // Textos
    // ---------------------------------------------------------------

    public function test_descricao_conta_os_dias(): void
    {
        $this->assertSame('vence hoje', PrazoChamado::descricao('2026-11-11', StatusChamado::EM_ANDAMENTO));
        $this->assertSame('vence amanhã', PrazoChamado::descricao('2026-11-12', StatusChamado::EM_ANDAMENTO));
        $this->assertSame('vence em 5 dias', PrazoChamado::descricao('2026-11-16', StatusChamado::EM_ANDAMENTO));
        $this->assertSame('atrasado há 1 dia', PrazoChamado::descricao('2026-11-10', StatusChamado::EM_ANDAMENTO));
        $this->assertSame('atrasado há 3 dias', PrazoChamado::descricao('2026-11-08', StatusChamado::PAUSADO));
    }

    public function test_texto_para_mensagens(): void
    {
        $this->assertSame('16/11/2026 (vence em 5 dias)', PrazoChamado::texto('2026-11-16', StatusChamado::EM_ANDAMENTO));
        $this->assertSame('08/11/2026 (atrasado há 3 dias)', PrazoChamado::texto('2026-11-08', StatusChamado::EM_ANDAMENTO));
        $this->assertSame('a definir quando um técnico assumir', PrazoChamado::texto(null, StatusChamado::ABERTO));
        $this->assertSame('não definido', PrazoChamado::texto(null, StatusChamado::EM_ANDAMENTO));
        // Encerrado: só a data, sem contagem.
        $this->assertSame('08/11/2026', PrazoChamado::texto('2026-11-08', StatusChamado::RESOLVIDO));
        $this->assertSame('não definido', PrazoChamado::texto(null, StatusChamado::RESOLVIDO));
    }

    // ---------------------------------------------------------------
    // Quem recebe cada lembrete (tabela aprovada)
    // ---------------------------------------------------------------

    public function test_em_andamento_vence_hoje_avisa_tecnico_e_dono(): void
    {
        $this->assertSame(['tecnico', 'dono'], PrazoChamado::destinatarios(StatusChamado::EM_ANDAMENTO, PrazoChamado::VENCE_HOJE));
    }

    public function test_em_andamento_atrasado_avisa_so_o_tecnico(): void
    {
        $this->assertSame(['tecnico'], PrazoChamado::destinatarios(StatusChamado::EM_ANDAMENTO, PrazoChamado::ATRASADO));
    }

    public function test_pausado_e_aguardando_teste_avisam_so_o_dono(): void
    {
        foreach ([StatusChamado::PAUSADO, StatusChamado::AGUARDANDO_TESTE] as $status) {
            $this->assertSame(['dono'], PrazoChamado::destinatarios($status, PrazoChamado::VENCE_HOJE));
            $this->assertSame(['dono'], PrazoChamado::destinatarios($status, PrazoChamado::ATRASADO));
        }
    }

    public function test_sem_lembrete_para_quem_esta_no_prazo_aberto_ou_encerrado(): void
    {
        $this->assertSame([], PrazoChamado::destinatarios(StatusChamado::EM_ANDAMENTO, PrazoChamado::NO_PRAZO));
        $this->assertSame([], PrazoChamado::destinatarios(StatusChamado::ABERTO, PrazoChamado::A_DEFINIR));
        $this->assertSame([], PrazoChamado::destinatarios(StatusChamado::RESOLVIDO, PrazoChamado::ENCERRADO));
    }
}
