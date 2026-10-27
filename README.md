# Sistema de Chamados

Help desk multiempresa para abrir, triar e acompanhar chamados de suporte de TI, com triagem assistida por IA, chat em tempo real e notificações por WhatsApp. Usado em produção por um grupo de empresas.

<!-- Prints: adicionar imagens em docs/screenshots/ e referenciar aqui -->

**Laravel 12 · Inertia 2 + React 18 · Laravel Reverb · MySQL · Tailwind CSS**

## Destaques

- **Abertura de chamado assistida por IA.** O usuário descreve o problema em texto livre (ou por ditado de voz). A IA, via Groq, faz perguntas curtas quando falta informação e devolve título, descrição e a classificação tipo → motivo → detalhe. A resposta segue um JSON Schema em *strict mode*, cujos `enum`s são gerados com os IDs reais da taxonomia ativa. Antes de preencher o formulário, o backend ainda revalida a combinação, e o usuário revisa tudo antes de enviar.
- **Tempo real com Laravel Reverb + Echo.** Chat por chamado entre solicitante e técnico, chat interno da equipe técnica com menções `@` e notificações que chegam sem recarregar a página. Os canais são privados e seguem as mesmas regras de acesso do backend (`routes/channels.php`).
- **Notificações multicanal.** Central de notificações no sistema, notificação nativa do navegador, e-mail e WhatsApp (Evolution API), conforme as preferências de cada usuário.
- **Multiempresa com 5 perfis de acesso.** Usuários são vinculados a empresas e localizações. O que cada perfil enxerga é definido em *query scopes* do Eloquent, reaproveitados na listagem, na busca, nos dashboards e no relatório.
- **Dashboards por perfil e relatório semanal em PDF.** Indicadores e gráficos (Recharts) para a administração e para cada técnico, mais um relatório semanal com filtros e exportação via DomPDF.
- **Organização do trabalho técnico.** Quadro Kanban com checklist, previsão de término e observações internas por chamado, e fila pessoal do técnico reordenável com drag and drop.

## Funcionalidades

### Usuário (solicitante)
- Abertura de chamado por empresa e localização vinculadas ao usuário, com classificação em três níveis, patrimônio e anexos de até 50 MB (imagens, PDF, Office, áudio).
- "Abrir com IA" (experimental), com ditado por voz via Web Speech API.
- Chat com o técnico responsável: anexos, mensagens de voz gravadas no navegador e confirmação de leitura.
- Histórico unificado do chamado: mudanças de status, atribuições, observações e edições.
- Configurações pessoais: canais de notificação, foto de perfil com recorte e tema escuro.

O perfil **Gestor** vê os chamados das localizações que gerencia.

### Técnico
- Dashboard pessoal com:
  - chamados ativos, resolvidos e atrasados (abertos há mais de 48 h);
  - tendência dos últimos 14 dias, produtividade diária do mês e resolvidos nos últimos 6 meses;
  - tempo médio de resolução e a fila de chamados abertos ainda sem responsável.
- Fila pessoal reordenável por drag and drop.
- Quadro Kanban (Aberto, Em Andamento, Resolvidos nos últimos 7 dias) com modal de detalhes: checklist com progresso, previsão de término e observações internas.
- Seis status de chamado. Quem coloca um chamado "Em Andamento" assume a responsabilidade por ele, e reabrir o chamado remove o responsável.
- Chat da equipe técnica com menções, anexos e áudio.
- Relatório semanal restrito aos próprios chamados.

### Administrador e Super Admin
- Dashboard geral com:
  - KPIs, chamados atrasados e tendência de 14 dias;
  - distribuição por status e top 5 localizações;
  - carga atual e histórico por técnico, e a tabela de pendentes.
- Relatório semanal (ciclo de terça a terça ou período personalizado):
  - filtros por status, técnico e tipo;
  - KPIs de novos, resolvidos e backlog, além da carga por técnico;
  - exportação em PDF.
- Cadastros:
  - usuários, com vínculos de empresa e localização; o reset de senha obriga a troca no próximo login;
  - localizações e patrimônios;
  - a taxonomia tipo → motivo → detalhe, que técnicos também podem editar.
- Empresas são gerenciadas pelo Super Admin. O Administrador só vê as empresas a que está vinculado.
- Busca global por chamados (respeitando a visibilidade do perfil), patrimônios e usuários.

### Escritório 3D (`/escritorio`)
Visão em Three.js da equipe técnica, só para os técnicos e o coordenador. Atualiza sozinha a cada 30 s.
- Cada técnico tem uma baia; quem senta com quem fica em `fileiras` no config; quem está em `infra` no config (hoje o Jeliel) fica na área de Infraestrutura, ao lado dos racks. Os papéis na mesa são a fila dele (cor = status), o monitor mostra o chamado em andamento, a luz vermelha acende quando há chamado Aberto ou Em Andamento há mais de 48 h (Aguardando Teste e Pausado não contam como atraso) e o troféu vai para quem mais resolveu nos últimos 7 dias.
- O rodapé passa as últimas movimentações uma a uma (pausa com o mouse em cima). O painel "Movimento recente", minimizado no canto, abre com tudo que mudou de status nos últimos 7 dias, os últimos fechados e os últimos que alguém pegou para fazer; o que mudou na última hora fica destacado.
- Clicar na baia abre a fila, os últimos chamados colocados em andamento (30 dias) e os últimos fechados, com links para cada chamado.
- O coordenador (Renato Lima, `config('escritorio.chefe')`) fica na sala de vidro; clicar nele, no painel da parede ou na mesa de triagem abre a visão da equipe: carga de cada um, atrasados, fila sem responsável e ranking. De tempos em tempos ele sai da sala e passa nas baias em rodízio, por todos da equipe.
- Mais ou menos a cada 10 minutos (a primeira 2 min depois de abrir a tela) alguém levanta e vai à copa pegar café, beber água ou sentar um pouco no sofá, e depois volta para a baia.
- Mensagens do chat da equipe viram balões em cima de quem falou; resolver um chamado solta confete na baia e um aviso na tela.
- Modo TV (`/escritorio?tv`): gira na visão geral e passa por cada pessoa.
- Os bonecos foram montados a partir das fotos de perfil, em `config/escritorio.php`. O coordenador ajusta pela tela (botão "Aparência"); o ajuste fica em `storage/app/escritorio/aparencias.json`.
- Quem aparece, o chefe, o limite de atraso e o intervalo de atualização também ficam em `config/escritorio.php`.

## Stack

**Backend:** PHP 8.2+, Laravel 12, Inertia.js 2, Laravel Reverb (WebSockets), Laravel Breeze (base da autenticação), barryvdh/laravel-dompdf, Ziggy, MySQL e fila em banco de dados.

**Frontend:** React 18, Vite 7, Tailwind CSS 3, shadcn/ui sobre Radix UI, Recharts, @hello-pangea/dnd, Laravel Echo + pusher-js, Framer Motion, date-fns, Sonner, react-easy-crop e lucide-react.

**Integrações:** Groq API (modelo `openai/gpt-oss-20b`) e Evolution API (WhatsApp).

## Decisões técnicas

- **Saída estruturada em vez de interpretar texto livre.** O schema enviado à Groq é montado a cada requisição a partir da taxonomia ativa no banco, com os IDs válidos como `enum`. O *strict mode* exige que todos os campos sejam obrigatórios. Por isso, um único schema cobre os dois tipos de resposta (`pergunta` e `classificacao`), e o prompt indica valores de preenchimento para os campos que não se aplicam. Mesmo assim, `validarConsistencia()` confere se o motivo pertence ao tipo e o detalhe ao motivo: o `enum` garante IDs válidos, não combinações válidas. A temperatura é baixa (0.2), e o serviço tenta até 3 vezes quando a camada gratuita responde 429/503. Ver `app/Services/AiChamadoService.php`.
- **Regras de negócio em services.** A criação, a mudança de status e a atribuição de técnico ficam em `app/Services/ChamadoService.php`, em transações que gravam o histórico junto. A tela do chamado e o Kanban usam o mesmo service, então histórico e notificações são os mesmos, venha a ação de onde vier.
- **Notificação não derruba a operação.** `notificarComSeguranca()` envolve o envio em `try/catch`. Se o broadcast ou o e-mail estiver fora do ar, o chamado é criado ou atualizado mesmo assim e a falha vai para o log. A preferência do usuário define os canais de cada notificação (`database`, `broadcast`, `mail`) e o envio por WhatsApp.
- **Status como fonte única.** `app/Support/StatusChamado.php` define:
  - os 6 status;
  - os 3 principais, exibidos no Kanban;
  - os agrupamentos usados nos indicadores (por exemplo, "Pausado" conta como em andamento e "Cancelado" como resolvido).

  Assim, listagem, dashboards e relatório mostram os mesmos números.
- **Relatório baseado em histórico.** "Resolvidos no período" é calculado pelo histórico de status, não pela data de abertura. Um chamado aberto antes do ciclo e resolvido durante ele entra na conta. O cálculo do ciclo de terça a terça fica isolado em `app/Support/PeriodoRelatorio.php`, que tem testes.

## Como rodar localmente

**Requisitos:** PHP 8.2+, Composer, Node.js 20.19+ e MySQL, com o cliente `mysql` no PATH (o Laravel usa esse cliente para carregar o dump do schema).

```bash
git clone https://github.com/marcosserg12/sistema_chamados.git
cd sistema_chamados
composer install
npm install
cp .env.example .env
php artisan key:generate
```

No `.env`, troque `DB_CONNECTION=sqlite` por `mysql`, preencha as credenciais do banco (o projeto usa SQL específico de MySQL) e configure o Reverb:

```dotenv
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=local
REVERB_APP_KEY=local-key
REVERB_APP_SECRET=local-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

Depois, crie a estrutura do banco e o link dos uploads:

```bash
php artisan migrate
php artisan storage:link
```

Em um banco vazio, o `migrate` carrega primeiro `database/schema/mysql-schema.sql` (estrutura base, com as tabelas `tb_*`) e depois aplica as migrations mais recentes.

O repositório não traz dados iniciais. Para entrar no sistema, cadastre:
- os perfis em `tb_perfil` (1 Administrador, 2 Usuário, 3 Gestor, 4 Técnico, 5 Super Admin);
- um usuário ativo em `tb_usuario_laravel` (`st_ativo = 'A'`, senha em bcrypt). O login aceita e-mail ou nome de usuário.

Para subir a aplicação:

```bash
composer dev               # servidor, fila, logs (Pail) e Vite em paralelo
php artisan reverb:start   # em outro terminal: servidor WebSocket
```

No Windows, o Pail não roda (exige a extensão `pcntl`). Nesse caso, rode `php artisan serve`, `php artisan queue:listen` e `npm run dev` em terminais separados. A fila precisa estar rodando para entregar as notificações em tempo real.

## Variáveis de ambiente

Além das variáveis padrão do Laravel:

| Variável | Para que serve | Obrigatória |
|---|---|---|
| `BROADCAST_CONNECTION` | `reverb` para ativar chat e notificações em tempo real | Sim |
| `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` | Credenciais do app no Reverb (qualquer valor em ambiente local) | Sim |
| `REVERB_HOST`, `REVERB_PORT`, `REVERB_SCHEME` | Endereço em que o backend publica os eventos | Sim |
| `VITE_REVERB_APP_KEY` | Chave usada pelo Echo no navegador | Sim (o Echo é inicializado no carregamento do frontend) |
| `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME` | Porta e protocolo do WebSocket no navegador (o host é o da própria página) | Sim em ambiente local (sem elas, o código usa `8081` e `https`) |
| `GROQ_API_KEY` | Chave da Groq para o "Abrir com IA" | Não. Sem ela, a IA avisa que a integração não está configurada e o resto funciona normalmente |
| `EVOLUTION_BASE_URL` | URL da instância da Evolution API | Não |
| `EVOLUTION_API_KEY` | Chave de acesso à Evolution API | Não |
| `EVOLUTION_INSTANCE` | Nome da instância que envia as mensagens de WhatsApp | Não |
| `APP_URL` | Base dos links enviados por WhatsApp | Recomendada |

As mensagens de WhatsApp só são enviadas a usuários com o canal ativo nas configurações e telefone cadastrado.

## Testes

```bash
php artisan test --testsuite=Unit
```

`tests/Unit/PeriodoRelatorioTest.php` cobre o cálculo do ciclo do relatório semanal (terça a terça) em quatro cenários, usando `Carbon::setTestNow()`:
- relatório aberto na própria terça;
- no meio da semana;
- no último dia do ciclo;
- a partir de uma data informada.

Os testes em `tests/Feature` são os gerados pelo Laravel Breeze e ainda não foram adaptados à tabela de usuários customizada (`tb_usuario_laravel`).

## Autor

**Marcos Sergio**, desenvolvedor PHP / Full Stack em Brasília.
[LinkedIn](https://www.linkedin.com/in/marcos-sergio-jord%C3%A3o-de-sousa-8b6864180)
