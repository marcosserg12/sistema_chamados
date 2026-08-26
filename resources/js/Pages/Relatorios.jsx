import React, { useState, useEffect, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/Components/ui/tooltip";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  FileText, Inbox, CheckCircle2, Clock, ChevronLeft, ChevronRight, CalendarRange,
  Download, SlidersHorizontal, Users2, Info, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Relatorios({ periodo, kpis, tabela, isVisaoGeral, filters, tecnicos = [], tipos = [], modo, cargaPorTecnico = [] }) {
  const [status, setStatus] = useState(filters?.status || "todos");
  const [tecnico, setTecnico] = useState(filters?.tecnico || "todos");
  const [tipo, setTipo] = useState(filters?.tipo || "todos");
  const [personalizado, setPersonalizado] = useState(modo === "personalizado");
  const [dataInicio, setDataInicio] = useState(periodo.inicio);
  const [dataFim, setDataFim] = useState(periodo.fim);
  const isFirstRender = useRef(true);

  const irParaCiclo = (novoInicio) => {
    router.get("/relatorios", { inicio: novoInicio, status, tecnico, tipo }, { preserveState: true, preserveScroll: true });
  };

  const aplicarPersonalizado = () => {
    router.get("/relatorios", {
      modo: "personalizado", data_inicio: dataInicio, data_fim: dataFim, status, tecnico, tipo,
    }, { preserveState: true, preserveScroll: true });
  };

  const voltarParaCiclo = () => {
    setPersonalizado(false);
    router.get("/relatorios", { status, tecnico, tipo }, { preserveState: true, preserveScroll: true });
  };

  const urlExportar = () => {
    const params = new URLSearchParams({ status, tecnico, tipo });
    if (personalizado) {
      params.set("modo", "personalizado");
      params.set("data_inicio", dataInicio);
      params.set("data_fim", dataFim);
    } else {
      params.set("inicio", periodo.inicio);
    }
    return `/relatorios/exportar?${params.toString()}`;
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = personalizado
      ? { modo: "personalizado", data_inicio: dataInicio, data_fim: dataFim, status, tecnico, tipo }
      : { inicio: periodo.inicio, status, tecnico, tipo };
    router.get("/relatorios", params, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
    // Intentionally only [status, tecnico, tipo]: personalizado/dataInicio/dataFim are read
    // from the latest render's closure when a filter changes (correct, no staleness), but
    // must NOT trigger this effect on their own — the date inputs update independently
    // (before "Aplicar" is clicked) and toggling the switch has its own explicit handlers below.
  }, [status, tecnico, tipo]);

  return (
    <AppLayout>
      <Head title="Relatório Semanal" />

      <div className="space-y-6 max-w-[1600px] mx-auto pb-16">

        {/* ===================== CABEÇALHO ===================== */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm"
        >
          {/* Wash decorativo sutil */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-3xl" />

          <div className="relative p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="hidden sm:flex w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 items-center justify-center shadow-lg shadow-indigo-500/20">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-0.5">
                    TI · Reunião Semanal
                  </p>
                  <h1 className="text-2xl sm:text-[28px] font-display font-black text-slate-900 dark:text-white leading-tight">
                    Relatório Semanal
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white px-3 py-1.5 font-semibold text-xs rounded-full">
                  {isVisaoGeral ? "Visão Geral" : "Meus Chamados"}
                </Badge>
                <Button asChild size="sm" className="rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 shadow-sm">
                  <a href={urlExportar()}>
                    <Download className="w-4 h-4 mr-1.5" /> Exportar PDF
                  </a>
                </Button>
              </div>
            </div>

            {/* Navegação de período */}
            {!personalizado ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-1">
                  <button
                    onClick={() => irParaCiclo(shiftDate(periodo.inicio, -7))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:hover:bg-slate-700 transition-all"
                    aria-label="Semana anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {formatBR(periodo.inicio)} <span className="text-slate-400 font-normal mx-0.5">a</span> {formatBR(periodo.fim)}
                  </span>
                  <button
                    onClick={() => irParaCiclo(shiftDate(periodo.inicio, 7))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:hover:bg-slate-700 transition-all"
                    aria-label="Próxima semana"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setPersonalizado(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                  <CalendarRange className="w-3.5 h-3.5" /> Período personalizado
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-2">
                <input
                  type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                  className="h-9 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-700 dark:text-slate-200"
                />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                  className="h-9 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-slate-700 dark:text-slate-200"
                />
                <Button onClick={aplicarPersonalizado} size="sm" className="h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                  Aplicar
                </Button>
                <button onClick={voltarParaCiclo} className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline ml-1">
                  Voltar pro ciclo semanal
                </button>
              </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-700/50 -mx-6 px-6 pt-4 -mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filtros
              </span>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 rounded-lg text-xs font-medium">
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
                  <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 rounded-lg text-xs font-medium">
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
                <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 rounded-lg text-xs font-medium">
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
          </div>
        </motion.div>

        {/* ===================== KPIS ===================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiItem delay={0.05} title="Novos" value={kpis.novos} icon={Inbox} color="blue" />
          <KpiItem delay={0.1} title="Resolvidos" value={kpis.resolvidos} icon={CheckCircle2} color="emerald" />
          <KpiItem delay={0.15} title="Backlog" subtitle="ainda em aberto" value={kpis.backlog} icon={Clock} color="amber" />
        </div>

        {/* ===================== GRÁFICO ===================== */}
        {isVisaoGeral && cargaPorTecnico.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
            <Card className="dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Users2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-base font-display">Carga por Técnico no Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cargaPorTecnico} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/40" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <ChartTooltip
                        cursor={{ fill: "rgba(99,102,241,0.06)" }}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      />
                      <Bar dataKey="value" name="Chamados" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ===================== TABELA / LISTA ===================== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
          <Card className="dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-900/30 py-4 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg font-display">Chamados do Período</CardTitle>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                {tabela.length} {tabela.length === 1 ? "chamado" : "chamados"}
              </span>
            </CardHeader>

            {tabela.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-2">
                <Inbox className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">Nenhum chamado neste período.</p>
              </div>
            ) : (
              <>
                {/* Lista em cartões — telas menores que lg */}
                <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                  {tabela.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => router.visit(`/chamados/${c.id}`)}
                      className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 active:bg-slate-100 dark:active:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] text-slate-400">#{c.id}</span>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug truncate">{c.titulo}</p>
                        </div>
                        <StatusPill status={c.st_status} label={c.status} />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        <MiniBadge>{c.tipo}</MiniBadge>
                        <CategoriaPill categoria={c.categoria} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate"><strong className="text-slate-600 dark:text-slate-300 font-semibold">Técnico:</strong> {c.tecnico}</span>
                        <span className="truncate text-right">{c.data_referencia}</span>
                        <span className="truncate col-span-2"><strong className="text-slate-600 dark:text-slate-300 font-semibold">Motivo:</strong> {c.motivo} · {c.detalhe}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Tabela completa — telas lg e maiores. table-fixed + colgroup em % garante
                    que a tabela nunca ultrapasse a largura do card (sem scroll horizontal);
                    cada célula trunca o próprio conteúdo em vez de forçar a coluna a crescer. */}
                <div className="hidden lg:block">
                  <table className="w-full table-fixed text-sm text-left">
                    <colgroup>
                      <col className="w-[5%]" />
                      <col className="w-[21%]" />
                      <col className="w-[8%]" />
                      <col className="w-[19%]" />
                      <col className="w-[11%]" />
                      <col className="w-[10%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-3 font-bold">ID</th>
                        <th className="px-3 py-3 font-bold">Título</th>
                        <th className="px-3 py-3 font-bold">Tipo</th>
                        <th className="px-3 py-3 font-bold">Classificação</th>
                        <th className="px-3 py-3 font-bold">Técnico</th>
                        <th className="px-3 py-3 font-bold">Status</th>
                        <th className="px-3 py-3 font-bold">
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 cursor-help underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 underline-offset-4">
                                  Categoria <Info className="w-3 h-3 shrink-0" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs normal-case font-normal">
                                Indica por que o chamado entrou neste relatório: foi aberto no período, foi
                                resolvido no período, ou segue em andamento (chamado mais antigo, ainda não
                                resolvido). Não é o status atual — isso já aparece na coluna Status.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </th>
                        <th className="px-3 py-3 font-bold">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {tabela.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => router.visit(`/chamados/${c.id}`)}
                          className="group hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.06] transition-colors cursor-pointer"
                        >
                          <td className="px-3 py-3 font-mono text-xs text-slate-400 truncate">#{c.id}</td>
                          <td className="px-3 py-3 truncate font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300" title={c.titulo}>
                            {c.titulo}
                          </td>
                          <td className="px-3 py-3 truncate text-slate-600 dark:text-slate-400">{c.tipo}</td>
                          <td className="px-3 py-3 text-slate-600 dark:text-slate-400 leading-tight">
                            <span className="block truncate font-medium text-slate-700 dark:text-slate-300" title={c.motivo}>{c.motivo}</span>
                            <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500" title={`${c.detalhe} · ${c.solicitacao}`}>
                              {c.detalhe} · {c.solicitacao}
                            </span>
                          </td>
                          <td className="px-3 py-3 truncate text-slate-600 dark:text-slate-400" title={c.tecnico}>{c.tecnico}</td>
                          <td className="px-3 py-3"><StatusPill status={c.st_status} label={c.status} /></td>
                          <td className="px-3 py-3"><CategoriaPill categoria={c.categoria} /></td>
                          <td className="px-3 py-3 truncate text-xs text-slate-500 dark:text-slate-400">{c.data_referencia}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}

function StatusPill({ status, label }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 max-w-full text-xs font-semibold px-2 py-1 rounded-full",
      status === 0 ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" :
      status === 1 ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" :
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
        status === 0 ? "bg-blue-500" : status === 1 ? "bg-amber-500" : "bg-emerald-500"
      )} />
      <span className="truncate">{label}</span>
    </span>
  );
}

function CategoriaPill({ categoria }) {
  return (
    <span
      title={categoria}
      className={cn("inline-block max-w-full truncate text-xs font-bold px-2 py-1 rounded-full",
        categoria === "Aberto no período" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" :
        categoria === "Em andamento" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" :
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      )}
    >
      {categoria}
    </span>
  );
}

function MiniBadge({ children }) {
  return (
    <span className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
      {children}
    </span>
  );
}

function KpiItem({ title, subtitle, value, icon: Icon, color, delay = 0 }) {
  const accent = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    emerald: "from-emerald-500 to-emerald-600",
  };
  const textColors = {
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  };
  const bgIcon = {
    blue: "bg-blue-50 dark:bg-blue-500/10",
    amber: "bg-amber-50 dark:bg-amber-500/10",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-2xl">
        <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", accent[color])} />
        <CardContent className="p-5 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 truncate">
              {title}{subtitle && <span className="normal-case font-medium text-slate-400"> ({subtitle})</span>}
            </p>
            <p className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white leading-none">{value}</p>
          </div>
          <div className={cn("w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center", bgIcon[color], textColors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function shiftDate(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatBR(isoDate) {
  return isoDate.split("-").reverse().join("/");
}
