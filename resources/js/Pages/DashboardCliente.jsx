import React, { useMemo } from "react";
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Ticket,
  Clock,
  CheckCircle,
  Plus,
  Server,
  Activity,
  Calendar,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  aberto: "#3b82f6",
  em_andamento: "#f59e0b",
  resolvido: "#10b981",
  fechado: "#64748b",
};

// 1. Recebemos os dados já filtrados e calculados pelo Laravel
export default function DashboardCliente({ kpis, sistemas, chamadosPorMes, porStatus, chamadosRecentes, resumoMensal }) {
  const { auth } = usePage().props;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Olá, {auth.user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe seus serviços e a saúde dos seus sistemas</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={route('chamados.create')}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Chamado
            </Button>
          </Link>
        </div>
      </div>

      {/* Status dos Sistemas (Vem do Backend) */}
      <Card className="dark:bg-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
            <Server className="w-5 h-5 text-slate-400" /> Saúde dos Sistemas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {sistemas.map((sistema) => (
              <div key={sistema.nome} className={cn(
                "p-4 rounded-lg border",
                sistema.status === "online" ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200" : "bg-amber-50 dark:bg-amber-900/10 border-amber-200"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium dark:text-white">{sistema.nome}</span>
                  <div className={cn("w-2 h-2 rounded-full", sistema.status === "online" ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                </div>
                <div className="text-sm flex justify-between">
                  <span className="text-slate-500">Uptime</span>
                  <span className="font-bold dark:text-slate-300">{sistema.uptime}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMini title="Meus Abertos" value={kpis.abertos} icon={Ticket} color="blue" />
        <KpiMini title="Em Atendimento" value={kpis.emAndamento} icon={Clock} color="amber" />
        <KpiMini title="Concluídos" value={kpis.resolvidos} icon={CheckCircle} color="emerald" />
        <KpiMini title="SLA Cumprido" value={`${kpis.slaCompliance}%`} icon={Activity} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Mensal */}
        <Card className="lg:col-span-2 dark:bg-slate-800">
          <CardHeader><CardTitle className="text-base">Histórico de Chamados</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chamadosPorMes}>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="chamados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resumo de Custos/Investimento */}
        <Card className="dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar /> Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-500">Serviços</span>
                <span className="font-bold dark:text-white">{resumoMensal.quantidade}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-slate-500">Total Investido</span>
                <span className="font-bold text-blue-600">R$ {resumoMensal.valor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="dark:text-slate-400">Qualidade (SLA)</span>
                <span className="dark:text-slate-300">{kpis.slaCompliance}%</span>
              </div>
              <Progress value={kpis.slaCompliance} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Chamados Recentes */}
      <Card className="dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimas Solicitações</CardTitle>
          <Link href={route('chamados.index')} className="text-xs text-blue-500 hover:underline">Ver todos</Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {chamadosRecentes.map(chamado => (
            <Link key={chamado.id} href={route('chamados.show', chamado.id)} className="flex items-center justify-between p-3 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate dark:text-white">{chamado.titulo}</p>
                <span className="text-xs text-slate-500">#{chamado.id} • {format(new Date(chamado.created_at), "dd/MM/yyyy")}</span>
              </div>
              <StatusBadge status={chamado.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiMini({ title, value, icon: Icon, color }) {
  const themes = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };
  return (
    <Card className={cn("dark:bg-slate-800", themes[color].split(' ')[2])}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="text-xl font-bold dark:text-white">{value}</p>
        </div>
        <div className={cn("p-2 rounded-lg", themes[color].split(' ')[0], themes[color].split(' ')[1])}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}