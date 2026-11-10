# Prazo de Entrega dos Chamados — Design

## Contexto

Até aqui o chamado não tinha prazo: o técnico aceitava e mudava o status. O
único campo parecido era a "previsão de término" do Kanban
(`dt_previsao_termino`), opcional e praticamente sem uso (1 de 1.184
chamados). "Atrasado" nos dashboards e no Escritório 3D significava "aberto há
mais de 48 h", o que marcava quase todo chamado pendente.

## Objetivo

1. Todo chamado assumido passa a ter um prazo de entrega, informado por quem
   assume.
2. Mudar o prazo exige justificativa, e tudo fica no histórico.
3. Lembretes automáticos para quem precisa agir: no dia em que vence e, depois,
   todo dia útil enquanto estiver atrasado.
4. O prazo aparece em todas as telas e em todas as mensagens; os atrasados
   aparecem nas notificações.

## Decisões (aprovadas)

| Tema | Decisão |
|---|---|
| Formato | Só a data. O chamado vence no fim do dia. Não aceita data no passado. |
| Quando é obrigatório | Ao assumir: sair de Aberto (ou de Resolvido/Cancelado) para Em Andamento, Pausado ou Aguardando Teste — pelo botão de status, por "Outros status" ou ao escolher o Responsável. Aberto → Resolvido/Cancelado direto não pede prazo. |
| Reabertura | Voltar para Aberto remove o técnico e o prazo (registrado no histórico). Reabrir de Resolvido/Cancelado direto para um status pendente pede prazo novo. |
| Troca de responsável | Mantém o prazo. |
| Chamados antigos | Ficam como estão: selo "Sem prazo", sem lembretes. O responsável ou um admin pode definir quando quiser (primeira definição sem justificativa). |
| Quem altera | Só o técnico responsável e Administrador/Super Admin. Justificativa obrigatória (mín. 10 caracteres), data diferente da atual, só em chamado pendente. Não dá para apagar o prazo. |
| Aviso de alteração | O dono recebe (data anterior, nova, justificativa, quem alterou). Se quem alterou não foi o técnico responsável, ele também recebe. |
| "Atrasado" | Em Andamento, Pausado ou Aguardando Teste com prazo anterior a hoje. A regra de 48 h sai dos dashboards. |
| Escritório 3D | Luz vermelha: Em Andamento com prazo vencido, ou Aberto sem ninguém há mais de 48 h (lá ainda não há prazo). Pausado/Aguardando Teste continuam fora. |
| Agenda dos lembretes | Segunda a sexta, às 8h. Prazo no fim de semana é cobrado na segunda como atrasado. |
| Agrupamento | WhatsApp e e-mail: um resumo por pessoa. Sino: uma notificação por chamado. |
| Canais | Seguem as preferências de canal existentes (WhatsApp/e-mail). Não há opção para desligar os lembretes de prazo. |

**Quem recebe cada lembrete**

|                            | Vence hoje      | Atrasado (todo dia útil) |
|----------------------------|-----------------|--------------------------|
| Em Andamento               | técnico + dono  | técnico                  |
| Pausado / Aguardando Teste | dono            | dono                     |
| Aberto (sem prazo)         | —               | —                        |

## Arquitetura

**Banco** (`2026_11_10_090000_add_prazo_to_chamados`)
- `tb_chamados.dt_prazo` (DATE) — substitui `dt_previsao_termino` (valor copiado, coluna removida; o `down()` desfaz).
- `tb_chamados.dt_lembrete_prazo` (DATE) — último dia em que o chamado entrou no lembrete; evita reenvio no mesmo dia.
- `tb_historico_prazo_chamado` — chamado, quem, prazo anterior, prazo novo, justificativa, data.

**Regras** — `app/Support/PrazoChamado.php` (espelho em `resources/js/lib/prazoChamado.js`):
`exigePrazo()`, `situacao()`, `descricao()`, `texto()`, `linhaWhatsApp()`, `destinatarios()`.

**Service** — `ChamadoService`:
- `atualizarStatus(..., ?string $prazo)` e `atribuirTecnico(..., ?string $prazo)` recusam com `ValidationException` quando o prazo é obrigatório e não veio. Atribuir um Aberto agora também grava o histórico de status e avisa o dono (com o prazo).
- `alterarPrazo()` + `podeAlterarPrazo()`; rota `POST /chamados/{id}/prazo` (substitui `/api/kanban/chamado/{id}/previsao`).

**Lembretes** — comando `chamados:lembrar-prazos` (`--simular`), agendado em `routes/console.php` (`weekdays()->at('08:00')->withoutOverlapping()`), lógica em `LembretePrazoService` (`montarEnvios()` e `mensagemWhatsApp()` são funções puras). Notificações: `PrazoLembrete` (sino, por chamado), `ResumoPrazos` (e-mail, por pessoa), `PrazoAlterado`.

**Mensagens** — a linha `📅 Prazo: 15/11/2026 (vence em 3 dias)` entra em todos os WhatsApps existentes (novo chamado, status, atribuição, observação, chat), nos e-mails e, como campo `prazo`, nas notificações do sino.

**Telas** — componentes `PrazoBadge`, `PrazoDialog` e `FaixaPrazos`, usados em: detalhes do chamado (caixa no cabeçalho, bloco de gestão, card de informações, histórico), lista (coluna, filtro e card "Atrasados"), Kanban (selo, borda vermelha, modal), dashboards geral/técnico/admin, relatório semanal (tela e PDF), Escritório 3D, sino, página de notificações, busca global e o aviso de "Novidades" (versão 2).

## Testes

- `tests/Unit/PrazoChamadoTest.php` e `tests/Unit/LembretePrazoTest.php` (regras e montagem dos lembretes, com data simulada).
- O que depende do banco foi verificado num banco MySQL local de teste com dados fictícios: 36 checagens do service (aceite sem prazo, data passada, permissões, justificativa, reabertura, atribuição, scopes), o comando (`--simular`, envio e reexecução no mesmo dia) e as telas no navegador.

## Implantação

1. `php artisan migrate` e `npm run build`.
2. `php artisan chamados:lembrar-prazos --simular` para conferir.
3. Cron: `* * * * * cd /caminho && php artisan schedule:run >> /dev/null 2>&1` (ou Agendador de Tarefas no Windows). O worker da fila continua necessário.

## Fora do escopo

Prazo sugerido por tipo de chamado, relatório de "% entregue no prazo",
feriados no cálculo de dias úteis e resumo diário para o coordenador.
