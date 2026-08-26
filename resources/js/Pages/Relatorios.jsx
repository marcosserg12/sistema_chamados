import React, { useState, useEffect, useRef } from "react";
import { Link, Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import { Button } from "@/Components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { FileText, Inbox, CheckCircle2, Clock, ChevronLeft, ChevronRight, Calendar, Download } from "lucide-react";
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

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                <button
                  onClick={() => {
                    setPersonalizado(false);
                    // No "inicio" param: lets the backend recompute the canonical
                    // Tuesday-anchored cycle instead of reusing a possibly
                    // non-Tuesday custom start date.
                    router.get("/relatorios", { status, tecnico, tipo }, { preserveState: true, preserveScroll: true });
                  }}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Voltar pro ciclo semanal
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-600 w-fit text-white px-3 py-1">
              {isVisaoGeral ? "Visão Geral" : "Meus Chamados"}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <a href={urlExportar()}><Download className="w-4 h-4 mr-1" /> Exportar PDF</a>
            </Button>
          </div>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiItem title="Novos" value={kpis.novos} icon={Inbox} color="blue" />
          <KpiItem title="Resolvidos" value={kpis.resolvidos} icon={CheckCircle2} color="emerald" />
          <KpiItem title="Backlog (ainda em aberto)" value={kpis.backlog} icon={Clock} color="amber" />
        </div>

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
                  <th className="px-6 py-3 font-semibold">Motivo</th>
                  <th className="px-6 py-3 font-semibold">Detalhe</th>
                  <th className="px-6 py-3 font-semibold">Solicitação</th>
                  <th className="px-6 py-3 font-semibold">Técnico</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th
                    className="px-6 py-3 font-semibold cursor-help"
                    title="Indica por que o chamado entrou neste relatório: foi aberto durante o período, ou é um chamado mais antigo que só foi resolvido durante o período. Não é o status atual (isso já aparece na coluna Status)."
                  >
                    Categoria
                  </th>
                  <th className="px-6 py-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {tabela.length === 0 ? (
                  <tr><td colSpan="10" className="text-center py-8 text-slate-400">Nenhum chamado neste período.</td></tr>
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
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.motivo}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.detalhe}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.solicitacao}</td>
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
                          c.categoria === "Aberto no período" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
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

function shiftDate(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatBR(isoDate) {
  return isoDate.split("-").reverse().join("/");
}
