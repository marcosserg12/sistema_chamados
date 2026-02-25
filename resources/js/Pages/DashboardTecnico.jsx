import React from "react";
import { Link, Head, usePage } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Progress } from "@/Components/ui/progress";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, BarChart, Bar, Legend, LineChart, Line, LabelList
} from "recharts";
import {
  Ticket, Clock, CheckCircle, AlertTriangle,
  Activity, TrendingUp, ArrowRight, User, Timer, Inbox, Tag, BarChart3, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";

export default function DashboardTecnico({
  kpis, dailyTrend, mesAtualPerformance, monthlyTrend, porTipo, tarefas, disponiveis, performance
}) {
  const { auth } = usePage().props;

  const totalAtendimentos14Dias = React.useMemo(() => {
    return dailyTrend.reduce((acc, curr) => acc + curr.chamados, 0);
  }, [dailyTrend]);

  // Custom Tooltip para os gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-md text-sm">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
            {payload[0].value} {payload[0].name || 'Atendimentos'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <Head title="Painel do Técnico" />

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-indigo-100 dark:border-indigo-900 shadow-sm shrink-0">
              {auth.user.ds_foto ? (
                <img src={`/storage/${auth.user.ds_foto}`} className="aspect-square h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                  {auth.user.ds_nome?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Meu Painel Técnico
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Olá, {auth.user.ds_nome}! Gerencie seus atendimentos e fila de trabalho.</p>
            </div>
          </div>
          <Badge className="bg-amber-500 text-white px-3 py-1 border-none font-bold uppercase tracking-wider">Modo Técnico</Badge>
        </div>

        {/* 1. MINHAS KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiItem title="Meus Ativos" value={kpis.ativos} icon={Clock} color="blue" />
          <KpiItem title="Resolvidos" value={kpis.resolvidos} icon={CheckCircle} color="emerald" />
          <KpiItem title="Meus Críticos" value={kpis.atrasados} icon={AlertTriangle} color="rose" />
          <KpiItem title="Atendimento Médio" value={`${performance.tempo_medio}h`} icon={Timer} color="amber" />
        </div>

        {/* BLOCO DE GRÁFICOS PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Área: Minha Atividade */}
          <Card className="lg:col-span-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg dark:text-white font-bold">
                <Activity className="w-5 h-5 text-indigo-500" /> Atividade Diária (14 dias)
              </CardTitle>
              <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800">
                Total: {totalAtendimentos14Dias}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend} margin={{ top: 30, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAreaTec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/30" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{fontSize: 12, fill: '#64748b'}}
                      padding={{ left: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                                        <Area 
                                          type="monotone" 
                                          dataKey="chamados" 
                                          name="Atendimentos" 
                                          stroke="#6366f1" 
                                          strokeWidth={3} 
                                          fill="url(#colorAreaTec)"
                                        >
                                          <LabelList 
                                            dataKey="chamados" 
                                            position="top" 
                                            offset={10} 
                                            formatter={(value) => value === 0 ? "" : value}
                                            style={{ fill: '#6366f1', fontSize: 12, fontWeight: 'bold' }} 
                                          />
                                        </Area>
                    
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Linha: Produtividade Diária do Mês Atual */}
          <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Resoluções Diárias (Mês Atual)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mesAtualPerformance} margin={{ top: 20, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/30" />
                    <XAxis
                      dataKey="dia"
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: "#64748b", fontSize: 10, fontWeight: 'bold'}}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: "#64748b", fontSize: 10, fontWeight: 'bold'}}
                    />
                    <Tooltip content={<CustomTooltip />} />
                                        <Line 
                                          type="monotone" 
                                          dataKey="resolvidos" 
                                          name="Resolvidos" 
                                          stroke="#10b981" 
                                          strokeWidth={3} 
                                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                          activeDot={{ r: 6, strokeWidth: 0 }}
                                        >
                                          <LabelList 
                                            dataKey="resolvidos" 
                                            position="top" 
                                            offset={10} 
                                            formatter={(value) => value === 0 ? "" : value}
                                            style={{ fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} 
                                          />
                                        </Line>
                    
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-4 text-[10px] uppercase font-black tracking-widest text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#10b981]" /> Atendimentos Finalizados
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NOVOS GRÁFICOS: TENDÊNCIA MENSAL E RESOLVIDOS POR TIPO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras Horizontais: Resolvidos por Motivo */}
          <Card className="lg:col-span-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg dark:text-white font-bold">
                <Tag className="w-5 h-5 text-sky-500" /> Resolvidos por Motivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porTipo} layout="vertical" margin={{ left: 10, right: 40, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      tick={{fontSize: 11, fontWeights: 'bold', fill: '#64748b'}}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Resolvidos"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {porTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'][index % 5]} />
                      ))}
                      <LabelList dataKey="value" position="right" offset={10} style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras: Tendência Mensal */}
          <Card className="lg:col-span-1 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg dark:text-white font-bold">
                <BarChart3 className="w-5 h-5 text-emerald-500" /> Resolvidos (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ left: -20, top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/30" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="resolvidos" name="Resolvidos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25}>
                      <LabelList 
                        dataKey="resolvidos" 
                        position="top" 
                        offset={10} 
                        formatter={(value) => value === 0 ? "" : value}
                        style={{ fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MINHA FILA DE TRABALHO */}
          <Card className="lg:col-span-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-700/50 flex flex-row items-center justify-between bg-white dark:bg-slate-800/50">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Clock className="w-5 h-5 text-blue-500" /> Minha Fila de Trabalho
              </CardTitle>
              <Badge variant="outline" className="dark:text-slate-400 font-bold">{tarefas.length} pendentes</Badge>
            </CardHeader>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {tarefas.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 font-medium">Você não tem chamados em curso.</div>
              ) : (
                tarefas.map((t) => (
                  <div key={t.id} className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all group",
                    t.atrasado && "bg-rose-50/30 dark:bg-rose-900/5"
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-[10px] uppercase tracking-wider">#{t.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                          t.atrasado ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {t.tempo_aberto}
                        </span>
                      </div>
                      <Link href={`/chamados/${t.id}`} className="block">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {t.titulo}
                        </h4>
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {t.motivo}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">•</span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {t.empresa}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-700">
                      <Link href={`/chamados/${t.id}`} className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs h-9 gap-2 shadow-sm">
                          Atender <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* FILA DE ESPERA (DISPONÍVEIS) */}
          <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-900 dark:bg-slate-950 text-white flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-400" /> Fila de Espera
              </CardTitle>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {disponiveis.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500 font-medium">Nenhum chamado aguardando técnico.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {disponiveis.map((d) => (
                    <Link key={d.id} href={`/chamados/${d.id}`} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-[10px]">#{d.id}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{d.data}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                        {d.titulo}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{d.motivo}</span>
                        <span className="opacity-30">•</span>
                        <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> {d.empresa}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
            {disponiveis.length > 0 && (
              <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <Link href="/chamados?status=0">
                  <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Ver Fila Completa
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}

function KpiItem({ title, value, icon: Icon, color }) {
  const styles = {
    blue: "border-l-4 border-l-blue-500 dark:bg-slate-800 bg-white shadow-sm",
    amber: "border-l-4 border-l-amber-500 dark:bg-slate-800 bg-white shadow-sm",
    emerald: "border-l-4 border-l-emerald-500 dark:bg-slate-800 bg-white shadow-sm",
    rose: "border-l-4 border-l-rose-500 dark:bg-slate-800 bg-white shadow-sm",
  };

  const textColors = {
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  const bgIcon = {
    blue: "bg-blue-50 dark:bg-blue-900/20",
    amber: "bg-amber-50 dark:bg-amber-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
    rose: "bg-rose-50 dark:bg-rose-900/20",
  };

  return (
    <Card className={cn("shadow-sm border-y-0 border-r-0 rounded-lg overflow-hidden", styles[color])}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        </div>
        <div className={cn("p-3 rounded-2xl shadow-inner", bgIcon[color], textColors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
