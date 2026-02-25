import React, { useMemo } from "react";
import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import KPICards from "@/Components/dashboard/KPICards";
import RecentTickets from "@/Components/dashboard/RecentTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Activity, TrendingUp } from "lucide-react";

// As cores exatas para o gráfico de pizza
const STATUS_COLORS = {
  aberto: "#3b82f6", // Azul
  emAndamento: "#f59e0b", // Laranja/Amarelo
  resolvido: "#10b981", // Verde
};

// ============================================================================
// COMPONENTES CUSTOMIZADOS PARA OS GRÁFICOS (Suporte perfeito ao Modo Escuro)
// ============================================================================

// Balão de informação customizado para o Gráfico de Barras
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl shadow-xl backdrop-blur-md">
        <p className="font-bold text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-100 dark:border-slate-700/50 pb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 text-sm mb-1.5 last:mb-0">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-300 font-medium">{entry.name}:</span>
            <span className="font-black text-slate-900 dark:text-white ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Balão de informação customizado para o Gráfico de Pizza
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 p-3 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-md">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: data.payload.color }} />
        <span className="text-slate-600 dark:text-slate-300 font-medium">{data.name}:</span>
        <span className="font-black text-slate-900 dark:text-white">{data.value}</span>
      </div>
    );
  }
  return null;
};

// Legenda customizada para o Gráfico de Barras
const CustomLegend = ({ payload }) => {
  return (
    <div className="flex justify-end gap-6 pb-4">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function Dashboard({
  kpis,
  chamadosRecentes = [],
  graficoStatus,
  trendSemanal = [],
}) {
  const { auth } = usePage().props;
  const id_perfil = auth.user.id_perfil;

  const showCharts = id_perfil === 1 || id_perfil === 4 || id_perfil === 5;

  const statusDistribution = useMemo(() => {
    if (!graficoStatus) return [];

    const data = [
      {
        name: "Abertos",
        value: graficoStatus?.abertos || 0,
        color: STATUS_COLORS.aberto,
      },
      {
        name: "Em Andamento",
        value: graficoStatus?.emAndamento || 0,
        color: STATUS_COLORS.emAndamento,
      },
      {
        name: "Resolvidos",
        value: graficoStatus?.resolvidos || 0,
        color: STATUS_COLORS.resolvido,
      },
    ];

    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    if (total === 0)
      return [{ name: "Sem Dados", value: 1, color: "#64748b" }];

    return data.filter((item) => item.value > 0);
  }, [graficoStatus]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <Head title="Dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
          Visão geral do sistema de chamados
        </p>
      </div>

      {/* BLOCO 1: KPIs do Usuário */}
      <KPICards data={kpis} />

      {/* BLOCO 2: Lista de Recentes */}
      <div className="w-full">
        <RecentTickets chamados={chamadosRecentes} />
      </div>

      {/* BLOCO 3: Gráficos Globais */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Gráfico de Barras */}
          <Card className="lg:col-span-2 shadow-sm bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700/50 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                <Activity className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Chamados por Dia (Meus vs Total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendSemanal} barGap={8} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="dia"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    />

                    {/* Tooltip Customizado para o Modo Escuro */}
                    <Tooltip cursor={{ fill: "rgba(100, 116, 139, 0.1)" }} content={<CustomBarTooltip />} />

                    {/* Legenda Customizada */}
                    <Legend content={<CustomLegend />} />

                    {/* Barra 1: Meus */}
                    <Bar
                      dataKey="meus"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                      name="Meus Chamados"
                    />

                    {/* Barra 2: Total */}
                    <Bar
                      dataKey="total"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                      name="Total do Sistema"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza */}
          <Card className="shadow-sm bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 flex flex-col backdrop-blur-sm rounded-xl">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700/50 mb-2 shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                Por Status (Visão Global)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="h-48 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="hover:opacity-80 transition-opacity duration-200 outline-none"
                        />
                      ))}
                    </Pie>
                    {/* Tooltip Customizado da Pizza */}
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 mt-4">
                {statusDistribution
                  .filter((i) => i.name !== "Sem Dados")
                  .map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/30 shadow-sm"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {item.name}{" "}
                        <span className="font-black text-slate-900 dark:text-white ml-1">
                          ({item.value})
                        </span>
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

Dashboard.layout = (page) => <AppLayout children={page} />;