import React, { useState, useEffect, useRef } from "react";
import { Link, Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import { FileText, Inbox, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
