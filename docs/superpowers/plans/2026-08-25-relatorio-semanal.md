# Relatório Semanal de Demandas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/relatorios` page that shows what happened in the current Tuesday-to-Tuesday work cycle (new tickets, resolved tickets, backlog, workload), scoped per role (general view for Admin/Super Admin, locked-to-self view for Técnico), filterable by status/técnico/tipo, and exportable to Excel and PDF.

**Architecture:** A new `RelatorioSemanalController` reuses the existing `Chamado` model's visibility scopes and adds period-based scopes. A pure, DB-free `PeriodoRelatorio` helper computes the Tuesday-anchored cycle. A new Inertia page (`Relatorios.jsx`) mirrors the existing `DashboardAdmin.jsx` structure. Export is handled by two small dedicated classes (`maatwebsite/excel`, `barryvdh/laravel-dompdf`) fed by the same filtered query the page uses.

**Tech Stack:** Laravel 12 / Inertia + React (JSX) / Carbon / recharts / shadcn-style UI components already in the repo / `maatwebsite/excel` / `barryvdh/laravel-dompdf`.

**Spec:** `docs/superpowers/specs/2026-08-25-relatorio-semanal-design.md`

## Global Constraints

- Access restricted to `id_perfil` in `[1, 4, 5]` (Admin, Técnico, Super Admin) — perfis 2 e 3 não acessam esta tela.
- Perfil 4 (Técnico) só pode ver os próprios chamados nesta tela, mesmo manipulando parâmetros da URL — a restrição é aplicada no backend, nunca só no frontend.
- Ciclo padrão do relatório: Terça a Terça. `inicio` (uma terça-feira) é sempre calculado como `Carbon::today()->previous(Carbon::TUESDAY)` quando não vier na query string; `fim` = `inicio + 7 dias` (exclusivo).
- **Não escrever testes automatizados que toquem o banco de dados** — o ambiente local está conectado ao banco de produção (ver descoberta durante o brainstorming) e não existe banco de teste isolado. A única exceção é o `PeriodoRelatorioTest`, que é puro (usa `Carbon::setTestNow()`, sem tocar Eloquent/DB).
- Toda verificação de comportamento que dependa do banco é **manual**, pelo navegador, com o servidor local rodando (`php artisan serve` / `npm run dev`, já configurados em `composer run dev`).
- Seguir os padrões visuais já usados em `DashboardAdmin.jsx` (mesmos componentes `Card`, `Badge`, `Select`, cores, dark mode).
- Nenhuma migration nova é necessária — todas as tabelas envolvidas já existem no banco real.

---

### Task 1: Instalar dependências de exportação (Excel e PDF)

**Files:**
- Modify: `composer.json` (via `composer require`, não editar manualmente)
- Create (gerado pelo publish): `config/excel.php`, `config/dompdf.php`

**Interfaces:**
- Produces: pacotes `maatwebsite/excel` (classe base `Maatwebsite\Excel\Concerns\FromCollection` etc., usada na Task 8) e `barryvdh/laravel-dompdf` (facade `Pdf`/`Barryvdh\DomPDF\Facade\Pdf`, usada na Task 8).

- [ ] **Step 1: Instalar os pacotes via composer**

Run:
```bash
composer require maatwebsite/excel
composer require barryvdh/laravel-dompdf
```

- [ ] **Step 2: Publicar as configurações dos pacotes**

Run:
```bash
php artisan vendor:publish --provider="Maatwebsite\Excel\ExcelServiceProvider"
php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"
```

- [ ] **Step 3: Verificar que os pacotes foram registrados corretamente**

Run: `php artisan about | findstr /I "excel dompdf"` (ou `grep -i "excel\|dompdf"` no bash)
Expected: nenhum erro ao rodar `php artisan about` (o comando roda por completo) e os arquivos `config/excel.php` e `config/dompdf.php` existem.

- [ ] **Step 4: Commit**

```bash
git add composer.json composer.lock config/excel.php config/dompdf.php
git commit -m "chore: add maatwebsite/excel and barryvdh/laravel-dompdf for report export"
```

---

### Task 2: Helper de período (ciclo terça-a-terça) — com teste automatizado puro

**Files:**
- Create: `app/Support/PeriodoRelatorio.php`
- Test: `tests/Unit/PeriodoRelatorioTest.php`

**Interfaces:**
- Produces: `App\Support\PeriodoRelatorio::ciclo(?string $inicio = null): array` retornando `['inicio' => Carbon, 'fim' => Carbon]`, onde `fim` é sempre `inicio->copy()->addDays(7)`. Consumido pela Task 4 (`RelatorioSemanalController`).

- [ ] **Step 1: Escrever o teste (falhando)**

Create `tests/Unit/PeriodoRelatorioTest.php`:

```php
<?php

namespace Tests\Unit;

use App\Support\PeriodoRelatorio;
use Carbon\Carbon;
use Tests\TestCase;

class PeriodoRelatorioTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_ciclo_padrao_quando_hoje_e_terca(): void
    {
        $terca = Carbon::now()->next(Carbon::TUESDAY)->startOfDay();
        Carbon::setTestNow($terca);

        $periodo = PeriodoRelatorio::ciclo();

        $this->assertTrue($periodo['inicio']->equalTo($terca->copy()->subDays(7)));
        $this->assertTrue($periodo['fim']->equalTo($terca));
    }

    public function test_ciclo_padrao_no_meio_da_semana(): void
    {
        $terca = Carbon::now()->next(Carbon::TUESDAY)->startOfDay();
        $quarta = $terca->copy()->addDay(); // um dia depois da terça
        Carbon::setTestNow($quarta);

        $periodo = PeriodoRelatorio::ciclo();

        $this->assertTrue($periodo['inicio']->equalTo($terca));
        $this->assertTrue($periodo['fim']->equalTo($terca->copy()->addDays(7)));
    }

    public function test_ciclo_padrao_no_ultimo_dia_do_ciclo(): void
    {
        $terca = Carbon::now()->next(Carbon::TUESDAY)->startOfDay();
        $segundaSeguinte = $terca->copy()->addDays(6); // último dia antes da próxima terça
        Carbon::setTestNow($segundaSeguinte);

        $periodo = PeriodoRelatorio::ciclo();

        $this->assertTrue($periodo['inicio']->equalTo($terca));
        $this->assertTrue($periodo['fim']->equalTo($terca->copy()->addDays(7)));
    }

    public function test_ciclo_a_partir_de_inicio_explicito(): void
    {
        $periodo = PeriodoRelatorio::ciclo('2026-08-18');

        $this->assertSame('2026-08-18 00:00:00', $periodo['inicio']->toDateTimeString());
        $this->assertSame('2026-08-25 00:00:00', $periodo['fim']->toDateTimeString());
    }
}
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `php artisan test tests/Unit/PeriodoRelatorioTest.php`
Expected: FAIL — `Class "App\Support\PeriodoRelatorio" not found`.

- [ ] **Step 3: Implementar o helper**

Create `app/Support/PeriodoRelatorio.php`:

```php
<?php

namespace App\Support;

use Carbon\Carbon;

class PeriodoRelatorio
{
    /**
     * Calcula o ciclo terça-a-terça.
     * Se $inicio não for informado, calcula o ciclo "atual": a terça-feira
     * mais recente (estritamente anterior a hoje) até a próxima terça-feira.
     * Isso garante que, ao abrir o relatório numa terça (dia da reunião),
     * o ciclo mostrado seja exatamente a semana que acabou de se encerrar.
     *
     * @return array{inicio: Carbon, fim: Carbon}
     */
    public static function ciclo(?string $inicio = null): array
    {
        $dataInicio = $inicio
            ? Carbon::parse($inicio)->startOfDay()
            : Carbon::today()->previous(Carbon::TUESDAY);

        return [
            'inicio' => $dataInicio,
            'fim' => $dataInicio->copy()->addDays(7),
        ];
    }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `php artisan test tests/Unit/PeriodoRelatorioTest.php`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add app/Support/PeriodoRelatorio.php tests/Unit/PeriodoRelatorioTest.php
git commit -m "feat: add Tuesday-to-Tuesday period calculation helper"
```

---

### Task 3: Filtro de tipo de chamado e scopes de período no model `Chamado`

**Files:**
- Modify: `app/Models/Chamado.php`

**Interfaces:**
- Consumes: nenhuma dependência nova.
- Produces: `scopeFiltrar` passa a aceitar `filters['tipo']`; novos scopes `scopeNovosNoPeriodo($query, $inicio, $fim)` e `scopeResolvidosNoPeriodo($query, $inicio, $fim)`. Consumidos pela Task 4.

- [ ] **Step 1: Adicionar o filtro de tipo em `scopeFiltrar`**

In `app/Models/Chamado.php`, dentro de `scopeFiltrar`, logo após o bloco `$query->when($filters['localizacao'] ?? null, ...)` (linhas 179-183 do arquivo atual), adicionar:

```php
        $query->when($filters['tipo'] ?? null, function ($q, $tipo) {
            if ($tipo !== 'todos') {
                $q->where('tb_chamados.id_tipo_chamado', $tipo);
            }
        });
```

- [ ] **Step 2: Adicionar os scopes de período**

Logo abaixo do método `scopeFiltrar` (depois do `return $query;` e do fechamento da função), adicionar:

```php
    /**
     * Chamados criados dentro do período (inclusive início, exclusive fim).
     */
    public function scopeNovosNoPeriodo($query, $inicio, $fim)
    {
        return $query->whereBetween('tb_chamados.dt_data_chamado', [$inicio, $fim]);
    }

    /**
     * Chamados que tiveram um registro de status "Resolvido" (9) dentro do período.
     * Usa o histórico, não a data de criação, porque um chamado pode ter sido
     * aberto antes do período e resolvido durante ele.
     */
    public function scopeResolvidosNoPeriodo($query, $inicio, $fim)
    {
        return $query->whereHas('historicosStatus', function ($q) use ($inicio, $fim) {
            $q->where('st_status', 9)->whereBetween('dt_update', [$inicio, $fim]);
        });
    }
```

- [ ] **Step 3: Verificação manual (sem banco de teste — ler o código com atenção)**

Não há como testar isso sem banco. Releia os dois scopes e confirme:
- `scopeNovosNoPeriodo` usa `dt_data_chamado` (coluna de criação, conforme `const CREATED_AT` no topo do model).
- `scopeResolvidosNoPeriodo` usa a relação `historicosStatus()` já existente no model (linha ~72) e a coluna `dt_update` de `HistoricoStatusChamado` (conforme o model `HistoricoStatusChamado`).

A verificação funcional real acontece na Task 4, quando o controller usar esses scopes contra dados reais pelo navegador.

- [ ] **Step 4: Commit**

```bash
git add app/Models/Chamado.php
git commit -m "feat: add tipo filter and period scopes to Chamado model"
```

---

### Task 4: Controller do relatório + rota + página Inertia (KPIs e tabela, sem filtros/gráfico/exportação ainda)

**Files:**
- Create: `app/Http/Controllers/RelatorioSemanalController.php`
- Create: `resources/js/Pages/Relatorios.jsx`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `App\Support\PeriodoRelatorio::ciclo()` (Task 2), `Chamado::visivelPara`, `Chamado::filtrar`, `Chamado::scopeNovosNoPeriodo`, `Chamado::scopeResolvidosNoPeriodo` (Task 3).
- Produces: rota nomeada `relatorios.index` (`GET /relatorios`); prop shape Inertia `{ periodo: {inicio, fim}, kpis: {novos, resolvidos, backlog}, tabela: array, isVisaoGeral: bool }` consumido pela Task 5 (filtros) e Task 6 (gráfico).

- [ ] **Step 1: Criar o controller**

Create `app/Http/Controllers/RelatorioSemanalController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use App\Support\PeriodoRelatorio;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class RelatorioSemanalController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->id_perfil, [1, 4, 5])) {
            return redirect()->route('chamados.index');
        }

        $periodo = PeriodoRelatorio::ciclo($request->input('inicio'));
        $filters = $this->resolverFiltros($request, $user);

        $baseVisivel = Chamado::visivelPara($user)->filtrar($filters);

        $novosIds = (clone $baseVisivel)
            ->novosNoPeriodo($periodo['inicio'], $periodo['fim'])
            ->pluck('id_chamado');

        $resolvidosIds = (clone $baseVisivel)
            ->resolvidosNoPeriodo($periodo['inicio'], $periodo['fim'])
            ->pluck('id_chamado');

        $idsPeriodo = $novosIds->merge($resolvidosIds)->unique()->values();

        $filtersBacklog = array_merge($filters, ['status' => 'todos']);
        $backlog = Chamado::visivelPara($user)
            ->filtrar($filtersBacklog)
            ->whereIn('st_status', [0, 1])
            ->count();

        $chamados = Chamado::whereIn('id_chamado', $idsPeriodo)
            ->with([
                'tipoChamado:id_tipo_chamado,ds_tipo_chamado',
                'empresa:id_empresa,ds_empresa',
                'tecnico',
                'historicosStatus' => function ($q) use ($periodo) {
                    $q->where('st_status', 9)
                        ->whereBetween('dt_update', [$periodo['inicio'], $periodo['fim']])
                        ->orderByDesc('dt_update');
                },
            ])
            ->orderByDesc('dt_data_chamado')
            ->get();

        $tabela = $chamados->map(function (Chamado $c) use ($novosIds) {
            $ehNovo = $novosIds->contains($c->id_chamado);
            $resolvidoEm = optional($c->historicosStatus->first())->dt_update;

            return [
                'id' => $c->id_chamado,
                'titulo' => $c->ds_titulo,
                'tipo' => $c->tipoChamado->ds_tipo_chamado ?? '-',
                'empresa' => $c->empresa->ds_empresa ?? '-',
                'tecnico' => $c->tecnico->ds_nome ?? 'Aguardando',
                'status' => match ((int) $c->st_status) {
                    0 => 'Aberto', 1 => 'Em Andamento', 9 => 'Resolvido', default => 'Outro',
                },
                'st_status' => (int) $c->st_status,
                'categoria' => $ehNovo ? 'Novo' : 'Resolvido',
                'data_referencia' => $ehNovo
                    ? Carbon::parse($c->dt_data_chamado)->format('d/m/Y H:i')
                    : ($resolvidoEm ? Carbon::parse($resolvidoEm)->format('d/m/Y H:i') : '-'),
            ];
        });

        return Inertia::render('Relatorios', [
            'periodo' => [
                'inicio' => $periodo['inicio']->toDateString(),
                'fim' => $periodo['fim']->copy()->subDay()->toDateString(),
            ],
            'kpis' => [
                'novos' => $novosIds->count(),
                'resolvidos' => $resolvidosIds->count(),
                'backlog' => $backlog,
            ],
            'tabela' => $tabela,
            'isVisaoGeral' => $user->id_perfil !== 4,
            'filters' => $filters,
        ]);
    }

    private function resolverFiltros(Request $request, $user): array
    {
        $filters = $request->only(['status', 'tecnico', 'tipo']);
        $filters['status'] = $filters['status'] ?? 'todos';
        $filters['tipo'] = $filters['tipo'] ?? 'todos';

        // Técnico (perfil 4) só pode ver os próprios chamados, ignorando
        // qualquer valor de "tecnico" vindo da query string.
        if ($user->id_perfil === 4) {
            $filters['tecnico'] = (string) $user->id_usuario;
        } else {
            $filters['tecnico'] = $filters['tecnico'] ?? 'todos';
        }

        return $filters;
    }
}
```

- [ ] **Step 2: Adicionar a rota**

In `routes/web.php`, dentro do grupo `Route::middleware(['auth', 'verified'])->group(function () { ... })` (o mesmo grupo onde está `Route::get('/board', ...)`), adicionar:

```php
    Route::get('/relatorios', [App\Http\Controllers\RelatorioSemanalController::class, 'index'])->name('relatorios.index');
```

- [ ] **Step 3: Criar a página Inertia (versão inicial, sem filtros/gráfico)**

Create `resources/js/Pages/Relatorios.jsx`:

```jsx
import React from "react";
import { Link, Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { FileText, Inbox, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Relatorios({ periodo, kpis, tabela, isVisaoGeral }) {
  return (
    <AppLayout>
      <Head title="Relatório Semanal" />

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Relatório Semanal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Período: {periodo.inicio.split("-").reverse().join("/")} a {periodo.fim.split("-").reverse().join("/")}
            </p>
          </div>
          <Badge className="bg-indigo-600 w-fit text-white px-3 py-1">
            {isVisaoGeral ? "Visão Geral" : "Meus Chamados"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiItem title="Novos" value={kpis.novos} icon={Inbox} color="blue" />
          <KpiItem title="Resolvidos" value={kpis.resolvidos} icon={CheckCircle2} color="emerald" />
          <KpiItem title="Backlog (ainda em aberto)" value={kpis.backlog} icon={Clock} color="amber" />
        </div>

        <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-4">
            <CardTitle className="text-lg">Chamados do Período</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-6 py-3 font-semibold">Título</th>
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">Empresa</th>
                  <th className="px-6 py-3 font-semibold">Técnico</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Categoria</th>
                  <th className="px-6 py-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {tabela.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-8 text-slate-400">Nenhum chamado neste período.</td></tr>
                ) : (
                  tabela.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => router.visit(`/chamados/${c.id}`)}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">#{c.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[260px]" title={c.titulo}>{c.titulo}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.tipo}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.empresa}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.tecnico}</td>
                      <td className="px-6 py-4">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded",
                          c.st_status === 0 ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                          c.st_status === 1 ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                          "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        )}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                          c.categoria === "Novo" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        )}>{c.categoria}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{c.data_referencia}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function KpiItem({ title, value, icon: Icon, color }) {
  const styles = {
    blue: "border-l-4 border-l-blue-500 dark:bg-slate-800 bg-white",
    amber: "border-l-4 border-l-amber-500 dark:bg-slate-800 bg-white",
    emerald: "border-l-4 border-l-emerald-500 dark:bg-slate-800 bg-white",
  };
  const textColors = {
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  };
  const bgIcon = {
    blue: "bg-blue-50 dark:bg-blue-900/20",
    amber: "bg-amber-50 dark:bg-amber-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
  };

  return (
    <Card className={cn("shadow-sm border-y-0 border-r-0 rounded-lg", styles[color])}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl", bgIcon[color], textColors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Verificação manual**

Run: `composer run dev` (sobe `php artisan serve` + `npm run dev` juntos, conforme já configurado em `composer.json`).

No navegador:
1. Logar com um usuário perfil 1 ou 5 e acessar `/relatorios` diretamente pela URL. Esperado: página carrega, mostra "Visão Geral", KPIs com números (possivelmente zeros se não houver chamados no ciclo atual) e a tabela.
2. Logar com um usuário perfil 4 (Técnico) e acessar `/relatorios`. Esperado: mostra "Meus Chamados" e a tabela só traz chamados desse técnico.
3. Logar com um usuário perfil 2 ou 3 e acessar `/relatorios`. Esperado: é redirecionado para `/chamados` (não consegue ver a página).
4. Clicar numa linha da tabela. Esperado: navega para `/chamados/{id}`.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/RelatorioSemanalController.php resources/js/Pages/Relatorios.jsx routes/web.php
git commit -m "feat: add weekly report page with KPIs and detail table"
```

---

### Task 5: Filtros (status, técnico, tipo) na tela

**Files:**
- Modify: `app/Http/Controllers/RelatorioSemanalController.php`
- Modify: `resources/js/Pages/Relatorios.jsx`

**Interfaces:**
- Consumes: `Chamado::filtrar` já aceita `status`/`tecnico`/`tipo` (Task 3).
- Produces: controller passa a devolver também `tecnicos` (lista para o select, só quando `isVisaoGeral`) e `tipos`; frontend envia esses filtros via `router.get`.

- [ ] **Step 1: Controller — carregar listas para os selects e devolver na resposta**

In `app/Http/Controllers/RelatorioSemanalController.php`, no método `index`, logo antes do `return Inertia::render(...)`, adicionar:

```php
        $tecnicos = $user->id_perfil === 4
            ? []
            : \App\Models\User::where('id_perfil', 4)->where('st_ativo', 'A')
                ->orderBy('ds_nome')->get(['id_usuario', 'ds_nome']);

        $tipos = \App\Models\TipoChamado::where('st_ativo', 'A')
            ->orderBy('ds_tipo_chamado')->get(['id_tipo_chamado', 'ds_tipo_chamado']);
```

E adicionar `'tecnicos' => $tecnicos, 'tipos' => $tipos,` ao array passado pra `Inertia::render`.

- [ ] **Step 2: Frontend — adicionar os selects de filtro**

In `resources/js/Pages/Relatorios.jsx`, importar `useState`, `useEffect`, `useRef` do React e o componente `Select`:

```jsx
import React, { useState, useEffect, useRef } from "react";
```
```jsx
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
```

Mudar a assinatura do componente para receber os novos props e adicionar o estado dos filtros, logo no início da função `Relatorios`:

```jsx
export default function Relatorios({ periodo, kpis, tabela, isVisaoGeral, filters, tecnicos = [], tipos = [] }) {
  const [status, setStatus] = useState(filters?.status || "todos");
  const [tecnico, setTecnico] = useState(filters?.tecnico || "todos");
  const [tipo, setTipo] = useState(filters?.tipo || "todos");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    router.get("/relatorios", { inicio: periodo.inicio, status, tecnico, tipo }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  }, [status, tecnico, tipo]);
```

Adicionar a barra de filtros logo abaixo do cabeçalho (depois do `</div>` que fecha o bloco do título/badge, antes do grid de KPIs):

```jsx
        <div className="flex flex-wrap gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="0">Aberto</SelectItem>
              <SelectItem value="1">Em Andamento</SelectItem>
              <SelectItem value="9">Resolvido</SelectItem>
            </SelectContent>
          </Select>

          {isVisaoGeral && (
            <Select value={tecnico} onValueChange={setTecnico}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Técnicos</SelectItem>
                {tecnicos.map((t) => (
                  <SelectItem key={t.id_usuario} value={String(t.id_usuario)}>{t.ds_nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60">
              <SelectValue placeholder="Tipo de Chamado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t.id_tipo_chamado} value={String(t.id_tipo_chamado)}>{t.ds_tipo_chamado}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
```

- [ ] **Step 3: Verificação manual**

No navegador, em `/relatorios` como Admin/Super Admin:
1. Trocar o filtro de Status para "Resolvido". Esperado: a URL ganha `?status=9...` e a tabela só mostra linhas com categoria/status compatíveis.
2. Trocar o filtro de Técnico para um técnico específico. Esperado: tabela e KPIs recalculam só pra esse técnico.
3. Trocar o filtro de Tipo. Esperado: mesma coisa, filtrando por tipo.
4. Como usuário perfil 4 (Técnico), confirmar que o select de Técnico não aparece.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/RelatorioSemanalController.php resources/js/Pages/Relatorios.jsx
git commit -m "feat: add status/tecnico/tipo filters to weekly report"
```

---

### Task 6: Navegação de período (anterior/próximo + intervalo personalizado)

**Files:**
- Modify: `app/Http/Controllers/RelatorioSemanalController.php`
- Modify: `resources/js/Pages/Relatorios.jsx`

**Interfaces:**
- Consumes: `PeriodoRelatorio::ciclo($inicio)` (Task 2) já aceita um `$inicio` explícito.
- Produces: query params `inicio` (ciclo) ou `modo=personalizado&data_inicio&data_fim` (intervalo livre), tratados no controller.

- [ ] **Step 1: Controller — suportar o modo personalizado**

In `app/Http/Controllers/RelatorioSemanalController.php`, substituir a linha:

```php
        $periodo = PeriodoRelatorio::ciclo($request->input('inicio'));
```

por:

```php
        if ($request->input('modo') === 'personalizado' && $request->filled(['data_inicio', 'data_fim'])) {
            $inicio = Carbon::parse($request->input('data_inicio'))->startOfDay();
            $fim = Carbon::parse($request->input('data_fim'))->addDay()->startOfDay(); // fim inclusivo pro usuário, exclusivo internamente
            $periodo = ['inicio' => $inicio, 'fim' => $fim];
        } else {
            $periodo = PeriodoRelatorio::ciclo($request->input('inicio'));
        }
```

E, no array retornado por `Inertia::render`, incluir também o modo atual para o frontend saber qual UI mostrar:

```php
            'modo' => $request->input('modo') === 'personalizado' ? 'personalizado' : 'ciclo',
```

- [ ] **Step 2: Frontend — setas de navegação e toggle de período personalizado**

In `resources/js/Pages/Relatorios.jsx`, importar os ícones de seta e adicionar `modo` aos props:

```jsx
import { FileText, Inbox, CheckCircle2, Clock, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
```

```jsx
export default function Relatorios({ periodo, kpis, tabela, isVisaoGeral, filters, tecnicos = [], tipos = [], modo }) {
```

Adicionar estado local para o modo personalizado, logo junto aos outros `useState`:

```jsx
  const [personalizado, setPersonalizado] = useState(modo === "personalizado");
  const [dataInicio, setDataInicio] = useState(periodo.inicio);
  const [dataFim, setDataFim] = useState(periodo.fim);

  const irParaCiclo = (novoInicio) => {
    router.get("/relatorios", { inicio: novoInicio, status, tecnico, tipo }, { preserveState: true, preserveScroll: true });
  };

  const aplicarPersonalizado = () => {
    router.get("/relatorios", {
      modo: "personalizado", data_inicio: dataInicio, data_fim: dataFim, status, tecnico, tipo,
    }, { preserveState: true, preserveScroll: true });
  };
```

Substituir o bloco do período no cabeçalho (o `<p>` com "Período: ...") por:

```jsx
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Relatório Semanal
            </h1>
            {!personalizado ? (
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => irParaCiclo(shiftDate(periodo.inicio, -7))} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {formatBR(periodo.inicio)} a {formatBR(periodo.fim)}
                </p>
                <button onClick={() => irParaCiclo(shiftDate(periodo.inicio, 7))} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setPersonalizado(true)} className="ml-2 text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Período personalizado
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                  className="h-9 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2" />
                <span className="text-slate-400 text-sm">até</span>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                  className="h-9 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2" />
                <button onClick={aplicarPersonalizado} className="h-9 px-3 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Aplicar
                </button>
                <button onClick={() => setPersonalizado(false)} className="text-xs text-slate-500 hover:underline">
                  Voltar pro ciclo semanal
                </button>
              </div>
            )}
          </div>
```

Adicionar os dois helpers de data (fora do componente, no fim do arquivo, junto da função `KpiItem`):

```jsx
function shiftDate(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatBR(isoDate) {
  return isoDate.split("-").reverse().join("/");
}
```

E remover a linha antiga `Período: {periodo.inicio.split("-").reverse().join("/")} a {periodo.fim.split("-").reverse().join("/")}` (substituída pelo bloco acima), assim como o `import { format } from "date-fns"` — não é usado aqui, não precisa adicionar.

- [ ] **Step 3: Verificação manual**

No navegador, em `/relatorios`:
1. Clicar na seta "anterior". Esperado: URL muda pra `?inicio=<terça 7 dias antes>`, período exibido recua uma semana, dados recalculam.
2. Clicar em "próxima" de volta. Esperado: volta pro ciclo atual.
3. Clicar em "Período personalizado", escolher duas datas manualmente e clicar "Aplicar". Esperado: tabela/KPIs recalculam pro intervalo escolhido (incluindo o dia final escolhido).
4. Clicar em "Voltar pro ciclo semanal". Esperado: volta pra visão de ciclo com as setas.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/RelatorioSemanalController.php resources/js/Pages/Relatorios.jsx
git commit -m "feat: add period navigation (prev/next cycle + custom range) to weekly report"
```

---

### Task 7: Gráfico de carga por técnico (visão geral)

**Files:**
- Modify: `app/Http/Controllers/RelatorioSemanalController.php`
- Modify: `resources/js/Pages/Relatorios.jsx`

**Interfaces:**
- Produces: prop `cargaPorTecnico: Array<{name: string, value: number}>` (só populado quando `isVisaoGeral`).

Conforme a spec, este gráfico mostra a **carga atual** (chamados em aberto/em andamento agora, `st_status` em `[0,1]`) por técnico — a mesma métrica de `$tecnicosWorkload` do `DashboardAdminController` — e não uma contagem restrita ao período. Respeita a visibilidade (`visivelPara`) e os filtros de tipo/técnico selecionados na tela, mas não o filtro de status (que seria redundante com o `[0,1]` fixo) nem o período.

- [ ] **Step 1: Controller — calcular a carga atual por técnico, respeitando os filtros de tipo/técnico**

In `app/Http/Controllers/RelatorioSemanalController.php`, adicionar antes do `return Inertia::render(...)`:

```php
        $cargaPorTecnico = [];
        if ($user->id_perfil !== 4) {
            $filtersCarga = array_merge($filters, ['status' => 'todos']);
            $cargaPorTecnico = \Illuminate\Support\Facades\DB::table('rl_chamado_usuario')
                ->joinSub(
                    Chamado::visivelPara($user)->filtrar($filtersCarga)->whereIn('tb_chamados.st_status', [0, 1]),
                    'c',
                    fn ($join) => $join->on('rl_chamado_usuario.id_chamado', '=', 'c.id_chamado')
                )
                ->join('tb_usuario_laravel as u', 'rl_chamado_usuario.id_usuario', '=', 'u.id_usuario')
                ->select('u.ds_nome as name', \Illuminate\Support\Facades\DB::raw('count(*) as value'))
                ->groupBy('u.ds_nome')
                ->orderByDesc('value')
                ->get();
        }
```

E adicionar `'cargaPorTecnico' => $cargaPorTecnico,` ao array do `Inertia::render`.

- [ ] **Step 2: Frontend — renderizar o gráfico**

In `resources/js/Pages/Relatorios.jsx`, importar os componentes de gráfico:

```jsx
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
```

Adicionar `cargaPorTecnico = []` aos props do componente e inserir o card do gráfico logo depois do grid de KPIs (antes do `<Card>` da tabela), só quando `isVisaoGeral`:

```jsx
        {isVisaoGeral && cargaPorTecnico.length > 0 && (
          <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader><CardTitle className="text-base">Carga por Técnico no Período</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cargaPorTecnico}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Chamados" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
```

- [ ] **Step 3: Verificação manual**

Como Admin/Super Admin em `/relatorios`, com pelo menos um chamado atribuído a um técnico no período: confirmar que o gráfico aparece com uma barra por técnico. Como Técnico (perfil 4), confirmar que o gráfico NÃO aparece.

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/RelatorioSemanalController.php resources/js/Pages/Relatorios.jsx
git commit -m "feat: add per-technician workload chart to weekly report (general view)"
```

---

### Task 8: Link de navegação no menu lateral

**Files:**
- Modify: `resources/js/Layouts/AppLayout.jsx`

**Interfaces:**
- Nenhuma (mudança isolada de UI).

- [ ] **Step 1: Importar o ícone**

`FileText` já está importado em `AppLayout.jsx` (linha 13) — não precisa adicionar nada no import.

- [ ] **Step 2: Adicionar o item de menu**

In `resources/js/Layouts/AppLayout.jsx`, dentro de `getNavigationGroups`, no grupo `"Dashboards"` (linhas 93-100), adicionar um item antes do fechamento do array `items`:

```js
        { name: "Relatório Semanal", href: "/relatorios", icon: FileText, show: isAdmin || isTecnico || isSuperAdmin },
```

Ficando:

```js
    {
      title: "Dashboards",
      items: [
        { name: "Visão Admin", href: "/dashboard/admin", icon: Shield, show: isAdmin || isSuperAdmin },
        { name: "Visão Técnico", href: "/dashboard/tecnico", icon: Wrench, show: isTecnico || isSuperAdmin },
        { name: "Relatório Semanal", href: "/relatorios", icon: FileText, show: isAdmin || isTecnico || isSuperAdmin },
      ]
    }
```

- [ ] **Step 3: Verificação manual**

Logar com cada perfil (1, 2, 3, 4, 5) e conferir na sidebar:
- Perfis 1, 4, 5: veem "Relatório Semanal" no grupo "Dashboards" e o link funciona.
- Perfis 2, 3: NÃO veem o item.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Layouts/AppLayout.jsx
git commit -m "feat: add weekly report link to sidebar navigation"
```

---

### Task 9: Exportação em Excel e PDF

**Files:**
- Create: `app/Exports/ChamadosRelatorioExport.php`
- Create: `resources/views/relatorios/pdf.blade.php`
- Modify: `app/Http/Controllers/RelatorioSemanalController.php`
- Modify: `routes/web.php`
- Modify: `resources/js/Pages/Relatorios.jsx`

**Interfaces:**
- Consumes: `maatwebsite/excel` (Task 1), a mesma lógica de montagem de `$tabela` do `index()` (Task 4).
- Produces: rota `relatorios.export` (`GET /relatorios/exportar?formato=xlsx|pdf&...filtros`).

- [ ] **Step 1: Extrair a montagem da tabela pra um método reutilizável**

In `app/Http/Controllers/RelatorioSemanalController.php`, substituir **todo o conteúdo do método `index()`** (o que foi construído nas Tasks 4, 6 e 7) por este método privado `montarRelatorio`, que consolida tudo o que já existia, mais um `$kpis` explícito:

```php
    private function montarRelatorio(Request $request, $user): array
    {
        if ($request->input('modo') === 'personalizado' && $request->filled(['data_inicio', 'data_fim'])) {
            $inicio = Carbon::parse($request->input('data_inicio'))->startOfDay();
            $fim = Carbon::parse($request->input('data_fim'))->addDay()->startOfDay();
            $periodo = ['inicio' => $inicio, 'fim' => $fim];
        } else {
            $periodo = PeriodoRelatorio::ciclo($request->input('inicio'));
        }

        $filters = $this->resolverFiltros($request, $user);

        $baseVisivel = Chamado::visivelPara($user)->filtrar($filters);

        $novosIds = (clone $baseVisivel)
            ->novosNoPeriodo($periodo['inicio'], $periodo['fim'])
            ->pluck('id_chamado');

        $resolvidosIds = (clone $baseVisivel)
            ->resolvidosNoPeriodo($periodo['inicio'], $periodo['fim'])
            ->pluck('id_chamado');

        $idsPeriodo = $novosIds->merge($resolvidosIds)->unique()->values();

        $filtersBacklog = array_merge($filters, ['status' => 'todos']);
        $backlog = Chamado::visivelPara($user)
            ->filtrar($filtersBacklog)
            ->whereIn('st_status', [0, 1])
            ->count();

        $kpis = [
            'novos' => $novosIds->count(),
            'resolvidos' => $resolvidosIds->count(),
            'backlog' => $backlog,
        ];

        $cargaPorTecnico = [];
        if ($user->id_perfil !== 4) {
            $filtersCarga = array_merge($filters, ['status' => 'todos']);
            $cargaPorTecnico = \Illuminate\Support\Facades\DB::table('rl_chamado_usuario')
                ->joinSub(
                    Chamado::visivelPara($user)->filtrar($filtersCarga)->whereIn('tb_chamados.st_status', [0, 1]),
                    'c',
                    fn ($join) => $join->on('rl_chamado_usuario.id_chamado', '=', 'c.id_chamado')
                )
                ->join('tb_usuario_laravel as u', 'rl_chamado_usuario.id_usuario', '=', 'u.id_usuario')
                ->select('u.ds_nome as name', \Illuminate\Support\Facades\DB::raw('count(*) as value'))
                ->groupBy('u.ds_nome')
                ->orderByDesc('value')
                ->get();
        }

        $chamados = Chamado::whereIn('id_chamado', $idsPeriodo)
            ->with([
                'tipoChamado:id_tipo_chamado,ds_tipo_chamado',
                'empresa:id_empresa,ds_empresa',
                'tecnico',
                'historicosStatus' => function ($q) use ($periodo) {
                    $q->where('st_status', 9)
                        ->whereBetween('dt_update', [$periodo['inicio'], $periodo['fim']])
                        ->orderByDesc('dt_update');
                },
            ])
            ->orderByDesc('dt_data_chamado')
            ->get();

        $tabela = $chamados->map(function (Chamado $c) use ($novosIds) {
            $ehNovo = $novosIds->contains($c->id_chamado);
            $resolvidoEm = optional($c->historicosStatus->first())->dt_update;

            return [
                'id' => $c->id_chamado,
                'titulo' => $c->ds_titulo,
                'tipo' => $c->tipoChamado->ds_tipo_chamado ?? '-',
                'empresa' => $c->empresa->ds_empresa ?? '-',
                'tecnico' => $c->tecnico->ds_nome ?? 'Aguardando',
                'status' => match ((int) $c->st_status) {
                    0 => 'Aberto', 1 => 'Em Andamento', 9 => 'Resolvido', default => 'Outro',
                },
                'st_status' => (int) $c->st_status,
                'categoria' => $ehNovo ? 'Novo' : 'Resolvido',
                'data_referencia' => $ehNovo
                    ? Carbon::parse($c->dt_data_chamado)->format('d/m/Y H:i')
                    : ($resolvidoEm ? Carbon::parse($resolvidoEm)->format('d/m/Y H:i') : '-'),
            ];
        });

        return compact('periodo', 'filters', 'kpis', 'tabela', 'cargaPorTecnico');
    }
```

`index()` passa a chamar esse método e só cuidar da resposta Inertia (incluindo `tecnicos`/`tipos`/`modo`/`isVisaoGeral`):

```php
    public function index(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->id_perfil, [1, 4, 5])) {
            return redirect()->route('chamados.index');
        }

        $dados = $this->montarRelatorio($request, $user);

        $tecnicos = $user->id_perfil === 4
            ? []
            : \App\Models\User::where('id_perfil', 4)->where('st_ativo', 'A')
                ->orderBy('ds_nome')->get(['id_usuario', 'ds_nome']);

        $tipos = \App\Models\TipoChamado::where('st_ativo', 'A')
            ->orderBy('ds_tipo_chamado')->get(['id_tipo_chamado', 'ds_tipo_chamado']);

        return Inertia::render('Relatorios', [
            'periodo' => [
                'inicio' => $dados['periodo']['inicio']->toDateString(),
                'fim' => $dados['periodo']['fim']->copy()->subDay()->toDateString(),
            ],
            'kpis' => $dados['kpis'],
            'tabela' => $dados['tabela'],
            'cargaPorTecnico' => $dados['cargaPorTecnico'],
            'isVisaoGeral' => $user->id_perfil !== 4,
            'filters' => $dados['filters'],
            'tecnicos' => $tecnicos,
            'tipos' => $tipos,
            'modo' => $request->input('modo') === 'personalizado' ? 'personalizado' : 'ciclo',
        ]);
    }
```

- [ ] **Step 2: Criar a classe de exportação Excel**

Create `app/Exports/ChamadosRelatorioExport.php`:

```php
<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ChamadosRelatorioExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(private Collection $linhas)
    {
    }

    public function collection()
    {
        return $this->linhas;
    }

    public function headings(): array
    {
        return ['ID', 'Título', 'Tipo', 'Empresa', 'Técnico', 'Status', 'Categoria', 'Data'];
    }

    public function map($linha): array
    {
        return [
            $linha['id'],
            $linha['titulo'],
            $linha['tipo'],
            $linha['empresa'],
            $linha['tecnico'],
            $linha['status'],
            $linha['categoria'],
            $linha['data_referencia'],
        ];
    }
}
```

- [ ] **Step 3: Criar a view do PDF**

Create `resources/views/relatorios/pdf.blade.php`:

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1e293b; }
        h1 { font-size: 16px; margin-bottom: 0; }
        p.periodo { color: #64748b; margin-top: 4px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
        th { background: #f8fafc; font-size: 11px; text-transform: uppercase; }
    </style>
</head>
<body>
    <h1>Relatório Semanal de Demandas</h1>
    <p class="periodo">Período: {{ $periodoInicio }} a {{ $periodoFim }}</p>
    <table>
        <thead>
            <tr>
                <th>ID</th><th>Título</th><th>Tipo</th><th>Empresa</th><th>Técnico</th><th>Status</th><th>Categoria</th><th>Data</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($linhas as $linha)
                <tr>
                    <td>#{{ $linha['id'] }}</td>
                    <td>{{ $linha['titulo'] }}</td>
                    <td>{{ $linha['tipo'] }}</td>
                    <td>{{ $linha['empresa'] }}</td>
                    <td>{{ $linha['tecnico'] }}</td>
                    <td>{{ $linha['status'] }}</td>
                    <td>{{ $linha['categoria'] }}</td>
                    <td>{{ $linha['data_referencia'] }}</td>
                </tr>
            @empty
                <tr><td colspan="8">Nenhum chamado neste período.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
```

- [ ] **Step 4: Adicionar o método `export()` e a rota**

In `app/Http/Controllers/RelatorioSemanalController.php`, adicionar:

```php
    public function export(Request $request)
    {
        $user = auth()->user();

        if (!in_array($user->id_perfil, [1, 4, 5])) {
            abort(403);
        }

        $dados = $this->montarRelatorio($request, $user);
        $formato = $request->input('formato', 'xlsx');

        $nomeArquivo = 'relatorio-semanal-' . $dados['periodo']['inicio']->format('Y-m-d');

        if ($formato === 'pdf') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('relatorios.pdf', [
                'linhas' => $dados['tabela'],
                'periodoInicio' => $dados['periodo']['inicio']->format('d/m/Y'),
                'periodoFim' => $dados['periodo']['fim']->copy()->subDay()->format('d/m/Y'),
            ]);

            return $pdf->download("{$nomeArquivo}.pdf");
        }

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ChamadosRelatorioExport($dados['tabela']),
            "{$nomeArquivo}.xlsx"
        );
    }
```

In `routes/web.php`, logo abaixo da rota `relatorios.index` criada na Task 4:

```php
    Route::get('/relatorios/exportar', [App\Http\Controllers\RelatorioSemanalController::class, 'export'])->name('relatorios.export');
```

- [ ] **Step 5: Botões de exportação no frontend**

In `resources/js/Pages/Relatorios.jsx`, importar `Button` e `Download`:

```jsx
import { Button } from "@/Components/ui/button";
```
```jsx
import { FileText, Inbox, CheckCircle2, Clock, ChevronLeft, ChevronRight, Calendar, Download } from "lucide-react";
```

Adicionar uma função que monta a URL de exportação preservando os filtros/período atuais, e os botões no cabeçalho (ao lado do Badge):

```jsx
  const urlExportar = (formato) => {
    const params = new URLSearchParams({ status, tecnico, tipo, formato });
    if (personalizado) {
      params.set("modo", "personalizado");
      params.set("data_inicio", dataInicio);
      params.set("data_fim", dataFim);
    } else {
      params.set("inicio", periodo.inicio);
    }
    return `/relatorios/exportar?${params.toString()}`;
  };
```

E, no JSX, logo depois do `<Badge>` no cabeçalho:

```jsx
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={urlExportar("xlsx")}><Download className="w-4 h-4 mr-1" /> Excel</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={urlExportar("pdf")}><Download className="w-4 h-4 mr-1" /> PDF</a>
            </Button>
          </div>
```

- [ ] **Step 6: Verificação manual**

Em `/relatorios`:
1. Clicar em "Excel". Esperado: baixa um `.xlsx` que abre corretamente, com as mesmas linhas visíveis na tela.
2. Clicar em "PDF". Esperado: baixa um `.pdf` legível, com o período correto no topo.
3. Trocar um filtro (ex: Status) e exportar de novo. Esperado: o arquivo reflete o filtro aplicado, não a tabela inteira.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/RelatorioSemanalController.php app/Exports/ChamadosRelatorioExport.php resources/views/relatorios/pdf.blade.php routes/web.php resources/js/Pages/Relatorios.jsx
git commit -m "feat: add Excel and PDF export to weekly report"
```
