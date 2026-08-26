# Relatório Semanal de Demandas — Design

## Contexto

Toda terça-feira há uma reunião de TI onde cada pessoa relata as demandas
da semana. O sistema de chamados é a ferramenta usada nessa reunião, mas
hoje não existe nenhuma tela pensada para essa visão — o Dashboard Admin
existente (`DashboardAdminController`) é uma visão gerencial "always-on"
(KPIs totais, sem recorte por período de trabalho), não uma visão de
"o que aconteceu desde a última reunião".

Este documento cobre apenas a primeira das três iniciativas levantadas na
revisão do sistema (relatório semanal). As outras duas — novos status de
chamado, e abertura assistida de chamado — são independentes e serão
desenhadas separadamente.

## Objetivo

Uma tela de relatório que:
1. Mostra o que aconteceu no ciclo de trabalho entre duas reuniões
   (padrão: terça a terça).
2. Tem uma visão "geral" (todos os técnicos) para Admin/Super Admin e uma
   visão "individual" (só os próprios chamados) para o Técnico, para que
   cada pessoa consiga falar sua parte na reunião a partir da própria tela.
3. Permite exportar o que está sendo visto (respeitando filtros e
   período) em Excel e PDF.

## Escopo

**Dentro do escopo:**
- Página nova em `/relatorios`.
- Cálculo de novos / resolvidos / backlog por período, considerando os 3
  status atuais (Aberto=0, Em Andamento=1, Resolvido=9).
- Gráfico de carga por técnico no período (visão geral).
- Filtros: técnico, tipo de chamado, status.
- Navegação de período: ciclo terça-a-terça com setas anterior/próxima, e
  toggle para intervalo de datas personalizado.
- Exportação em Excel (.xlsx) e PDF, respeitando filtros/período ativos.
- Controle de acesso por perfil (1, 4, 5), reaproveitando os scopes de
  visibilidade já existentes no model `Chamado`.

**Fora do escopo (fica para as outras iniciativas ou para depois):**
- Os novos status (Aguardando teste do usuário / Pausado-Aguardando peça
  / Cancelado) — quando existirem, entram como filtro adicional aqui.
- Abertura assistida de chamado (IA).
- Monitoramento de vida útil de computadores/patrimônio (adiado
  explicitamente pelo usuário).
- Alterar o Dashboard Admin existente — ele continua como está.

## Arquitetura

- **Controller novo:** `App\Http\Controllers\RelatorioSemanalController`
  - `index(Request $request)`: renderiza a página Inertia `Relatorios`
    com os dados computados para o período/filtros atuais.
  - `export(Request $request)`: gera e devolve o arquivo (xlsx ou pdf,
    via parâmetro `formato`) para o período/filtros atuais.
- **Rota:**
  ```
  Route::get('/relatorios', [RelatorioSemanalController::class, 'index'])->name('relatorios.index');
  Route::get('/relatorios/exportar', [RelatorioSemanalController::class, 'export'])->name('relatorios.export');
  ```
  Dentro do grupo `middleware(['auth', 'verified'])` já existente em
  `routes/web.php`, junto dos demais.
- **Página nova:** `resources/js/Pages/Relatorios.jsx`, seguindo o
  mesmo padrão visual/estrutural de `DashboardAdmin.jsx`.
- **Dependências novas (composer):**
  - `maatwebsite/laravel-excel` — exportação .xlsx
  - `barryvdh/laravel-dompdf` — exportação PDF

## Controle de acesso

Mesmo padrão do `DashboardAdminController::index()`: como `index()` é uma
página Inertia (não uma ação de API/mutação), a checagem redireciona em
vez de usar `abort(403)`, replicando exatamente o padrão já usado em
`DashboardAdminController`:

```php
if (!in_array($user->id_perfil, [1, 4, 5])) {
    return redirect()->route('chamados.index');
}
```

O endpoint de exportação (`export()`), por ser uma ação de download e não
uma página, usa `abort(403)` — mesmo padrão adotado nos controllers
recém-hardenizados (Usuario, Localizacao, Patrimonio).

- **Super Admin (5) / Admin (1):** visão geral por padrão. Filtro de
  "técnico" disponível e habilitado.
- **Técnico (4):** visão travada nos próprios chamados. O filtro de
  técnico não aparece (ou aparece desabilitado) nessa visão — o backend
  ignora qualquer `tecnico_id` vindo do request quando `id_perfil == 4`
  e força o filtro para o próprio usuário.

Perfis 2 (Usuário comum) e 3 (Gestor) não têm acesso a esta tela — não
fazem parte da reunião de TI.

## Período

- **Padrão:** ciclo terça-a-terça. O ciclo "atual" é definido como
  `[última terça-feira à 00:00, terça-feira seguinte à 00:00)` relativo a
  hoje — ou seja, sempre um intervalo fechado de 7 dias ancorado em
  terças, cobrindo exatamente o intervalo entre duas reuniões
  consecutivas.
- **Navegação:** setas "← anterior" / "próxima →" deslocam esse ciclo em
  blocos de 7 dias (sempre terça-a-terça).
- **Personalizado:** um toggle troca para um date-range picker livre
  (`data_inicio` / `data_fim`), que substitui o ciclo fixo enquanto
  ativo.
- Os parâmetros de período trafegam na query string
  (`?inicio=YYYY-MM-DD&fim=YYYY-MM-DD`), permitindo voltar/recarregar a
  mesma visão e sendo reaproveitados também na exportação.

## Dados e cálculo

Reaproveita os scopes existentes em `App\Models\Chamado`:
- `visivelPara($user)` como base de visibilidade. Atenção: hoje esse
  scope trata os perfis 1, 4 e 5 igualmente ("vê tudo"), o que é correto
  para Admin/Super Admin mas não para a visão individual do Técnico
  neste relatório. Por isso, quando `id_perfil == 4`, o controller aplica
  `visivelPara($user)` e, **em cima** do resultado, um filtro adicional
  por técnico responsável (`whereHas('relacionamentoUsuarios', ...)`)
  travado no próprio usuário — sem alterar o scope existente, que
  continua servindo os outros usos do sistema como está hoje.
- `scopeFiltrar` como referência de padrão para os filtros de status e
  técnico. O filtro de tipo de chamado ainda não existe nesse scope —
  será adicionado como parte desta feature.

KPIs do período:
- **Novos:** `Chamado::where('dt_data_chamado', 'between', [inicio, fim])`.
- **Resolvidos no período:** chamados cujo `HistoricoStatusChamado` tem
  um registro com `st_status = 9` e `dt_update` dentro do período (não
  usa `dt_data_chamado`, porque um chamado pode ter sido aberto antes do
  período e resolvido durante ele).
- **Backlog (ainda em aberto):** `st_status` em `[0, 1]`, **sem** recorte
  de período — é o total pendente até agora, para mostrar o que continua
  parado independente de quando entrou.

Gráfico de carga por técnico (visão geral): contagem de chamados
atribuídos (via `RelacaoChamadoUsuario`) com `st_status` em `[0, 1]` no
momento — reaproveita a mesma lógica de `$tecnicosWorkload` já existente
no `DashboardAdminController`.

Tabela detalhada: lista os chamados do período (novos + resolvidos,
com uma coluna indicando qual dos dois), respeitando os filtros de
status/técnico/tipo aplicados.

## Exportação

- Botão "Exportar" na tela, com escolha de formato (Excel ou PDF).
- A exportação reflete exatamente o que está filtrado/no período atual
  na tela (mesma query da tabela detalhada, sem paginação).
- Excel: uma planilha simples, colunas equivalentes às da tabela na
  tela (ID, título, tipo, técnico, status, data, empresa/local).
- PDF: mesma tabela, formatada para impressão/apresentação, com
  cabeçalho indicando o período do relatório.

## Testes

- Feature tests do controller cobrindo:
  - Cálculo correto de novos/resolvidos/backlog para um período fixo
    (usando factories/seed controlados).
  - Que um Técnico (perfil 4) só recebe seus próprios chamados, mesmo
    tentando manipular o parâmetro de técnico na query string.
  - Que perfis 2 e 3 recebem 403 ao acessar `/relatorios`.
  - Navegação de período (semana anterior/seguinte calcula o intervalo
    terça-a-terça corretamente).
  - Exportação gera arquivo com o formato e conteúdo esperado para um
    conjunto de dados conhecido.
