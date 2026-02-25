import React from "react";
import { Link, Head, router, usePage } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Progress } from "@/Components/ui/progress";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, CartesianGrid
} from "recharts";
import {
  Ticket, Clock, CheckCircle, AlertTriangle,
  Activity, Target, User, ArrowRight, LayoutDashboard, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardAdmin({
  kpis, dailyTrend, porStatus, localizacoesTop,
  tecnicosWorkload, tecnicosTotal, slaAlerts, tabelaChamados
}) {

  const goToChamado = (id) => {
    router.visit(`/chamados/${id}`);
  };

  // Custom Tooltip para os gráficos ficarem bonitos no claro e escuro
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-md text-sm">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
            {payload[0].value} Chamados
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <Head title="Dashboard Administrativo" />

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
              Gestão Administrativa
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Visão geral da operação e desempenho da equipe.</p>
          </div>
          <Badge className="bg-indigo-600 w-fit text-white px-3 py-1">Painel Master</Badge>
        </div>

        {/* 1. KPIS PRINCIPAIS (SLA Removido, Grid ajustado para 4 colunas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiItem title="Abertos" value={kpis.abertos} icon={Ticket} color="blue" />
          <KpiItem title="Em Curso" value={kpis.emAndamento} icon={Clock} color="amber" />
          <KpiItem title="Resolvidos" value={kpis.resolvidos} icon={CheckCircle} color="emerald" />
          <KpiItem title="Críticos (+48h)" value={kpis.atrasados} icon={AlertTriangle} color="rose" />
        </div>

        {/* GRÁFICOS: TENDÊNCIA E STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Área */}
          <Card className="lg:col-span-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                <Activity className="w-5 h-5 text-blue-500" /> Fluxo de Abertura (14 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/30" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}  padding={{ left: 15 }}/>
                    {/* Tooltip corrigido para modo claro/escuro */}
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="chamados" name="Chamados" stroke="#3b82f6" strokeWidth={3} fill="url(#colorArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza (Status) */}
          <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
            <CardHeader><CardTitle>Volume por Status</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center">
              <div className="h-48 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porStatus}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {porStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda Melhorada */}
              <div className="flex flex-wrap justify-center gap-3 text-xs mt-4 px-2">
                {porStatus.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GESTÃO: CARGA TÉCNICA E TOTAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Carga Atual */}
          <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader><CardTitle className="text-base">Carga Atual (Em aberto)</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {tecnicosWorkload.length === 0 ? (
                 <p className="text-sm text-slate-400 text-center py-4">Nenhum chamado atribuído.</p>
              ) : (
                tecnicosWorkload.map((tec) => (
                  <div key={tec.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm items-center">
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="w-6 h-6 shrink-0">
                          {tec.ds_foto ? (
                            <img src={`/storage/${tec.ds_foto}`} className="aspect-square h-full w-full object-cover" />
                          ) : (
                            <AvatarFallback className="text-[8px] bg-slate-100 dark:bg-slate-700">
                              {tec.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="dark:text-white font-medium truncate" title={tec.name}>{tec.name}</span>
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0 ml-2">{tec.carga}</span>
                    </div>
                    <Progress value={(tec.carga / 15) * 100} className={cn("h-2", tec.carga > 10 ? "[&>div]:bg-rose-500" : "[&>div]:bg-blue-500")} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Ranking Histórico */}
          <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Total Atendimentos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tecnicosTotal.length === 0 ? (
                 <p className="text-sm text-slate-400 text-center py-4">Sem dados históricos.</p>
              ) : (
                tecnicosTotal.map((tec, idx) => (
                  <div key={tec.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700/50 last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0", idx === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300")}>
                            {idx + 1}º
                        </span>
                        <Avatar className="w-6 h-6 shrink-0 border border-slate-100 dark:border-slate-700">
                          {tec.ds_foto ? (
                            <img src={`/storage/${tec.ds_foto}`} className="aspect-square h-full w-full object-cover" />
                          ) : (
                            <AvatarFallback className="text-[8px] bg-slate-100 dark:bg-slate-700">
                              {tec.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="dark:text-slate-300 font-medium truncate" title={tec.name}>{tec.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 dark:text-white ml-2 shrink-0">{tec.total}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Alertas SLA (Com nova formatação de data) */}
          <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Críticos (+48h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {slaAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-emerald-600 gap-2">
                      <CheckCircle className="w-8 h-8 opacity-50" />
                      <p className="text-sm font-medium">Tudo em dia!</p>
                  </div>
              ) : (
                  slaAlerts.map((alerta) => (
                    <Link
                        key={alerta.id}
                        href={`/chamados/${alerta.id}`}
                        className="block p-3 bg-white dark:bg-slate-900/50 rounded-lg border border-rose-100 dark:border-rose-900/50 shadow-sm hover:shadow-md hover:border-rose-300 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800 dark:text-rose-200 text-xs group-hover:text-rose-600 transition-colors">#{alerta.id}</span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300 px-1.5 py-0.5 rounded">Atrasado</span>
                      </div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={alerta.titulo}>{alerta.titulo}</div>
                      <div className="flex justify-between items-center mt-2 text-[10px]">
                          <span className="text-slate-500 dark:text-slate-500 truncate max-w-[100px]">{alerta.empresa}</span>
                          {/* Nova formatação de tempo */}
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{alerta.tempo_atraso}</span>
                      </div>
                    </Link>
                  ))
              )}
            </CardContent>
          </Card>

          {/* 4. Top Localizações (Ocupando espaço total e legenda corrigida) */}
          <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader><CardTitle className="text-base">Top Localizações</CardTitle></CardHeader>
            <CardContent className="p-0 pb-4 pr-4"> {/* Removido padding interno para maximizar espaço */}
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   {/* margin right removida para ir até o final */}
                   <BarChart data={localizacoesTop} layout="vertical" margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 11, fill: '#64748b'}} interval={0} axisLine={false} tickLine={false} />
                     <Tooltip content={<CustomTooltip />} />
                     {/* Adicionado name="Chamados" para a legenda interna do tooltip */}
                     <Bar dataKey="value" name="Chamados" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={28} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* TABELA GLOBAL (Com nova formatação de data) */}
        <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-indigo-600" />
                        Fila de Atendimento (Abertos / Em Andamento)
                    </CardTitle>
                    <Link href="/chamados" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline">
                        Gerenciar Fila <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 font-semibold">ID</th>
                            <th className="px-6 py-3 font-semibold">Título</th>
                            <th className="px-6 py-3 font-semibold">Empresa</th>
                            <th className="px-6 py-3 font-semibold">Técnico</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold">Tempo Aberto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tabelaChamados.data.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-8 text-slate-400">Nenhum chamado pendente no momento.</td></tr>
                        ) : (
                            tabelaChamados.data.map((chamado) => (
                                <tr
                                    key={chamado.id}
                                    onClick={() => goToChamado(chamado.id)}
                                    title="Clique para visualizar o chamado"
                                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{chamado.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[300px]" title={chamado.titulo}>
                                            {chamado.titulo}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-0.5">{chamado.data}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={chamado.empresa}>
                                        {chamado.empresa}
                                    </td>
                                    <td className="px-6 py-4">
                                        {chamado.tecnico !== 'Aguardando' ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6 border border-slate-100 dark:border-slate-700">
                                                  {chamado.foto_tecnico ? (
                                                    <img src={`/storage/${chamado.foto_tecnico}`} className="aspect-square h-full w-full object-cover rounded-full" />
                                                  ) : (
                                                    <AvatarFallback className="text-[8px] bg-slate-100 dark:bg-slate-700">
                                                      {chamado.tecnico?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                    </AvatarFallback>
                                                  )}
                                                </Avatar>
                                                <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{chamado.tecnico}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic text-xs bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">Aguardando</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("w-2 h-2 rounded-full shadow-sm",
                                                chamado.st_code === 0 ? 'bg-blue-500' : 'bg-amber-500'
                                            )}></span>
                                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{chamado.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* Nova formatação de tempo aqui */}
                                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                                            {chamado.tempo_aberto_formatado}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-2">
                {tabelaChamados.links.map((link, i) => (
                    link.url ? (
                        <Link
                            key={i}
                            href={link.url}
                            className={cn(
                                "px-3 py-1 text-xs rounded border transition-colors",
                                link.active
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={i}
                            className="px-3 py-1 text-xs rounded border bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )
                ))}
            </div>
        </Card>

      </div>
    </AppLayout>
  );
}

// KPI ITEM
function KpiItem({ title, value, icon: Icon, color }) {
  const styles = {
    blue: "border-l-4 border-l-blue-500 dark:bg-slate-800 bg-white",
    amber: "border-l-4 border-l-amber-500 dark:bg-slate-800 bg-white",
    emerald: "border-l-4 border-l-emerald-500 dark:bg-slate-800 bg-white",
    rose: "border-l-4 border-l-rose-500 dark:bg-slate-800 bg-white",
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