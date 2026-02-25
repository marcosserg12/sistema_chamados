import React from "react";
import { Card, CardContent } from "@/Components/ui/card";
import { Ticket, Clock, CheckCircle, TrendingUp, TrendingDown, Inbox, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const kpiConfig = {
  abertos: {
    icon: Inbox,
    // Adicionado fundo com 20% de opacidade e uma borda subtil da mesma cor no modo escuro
    bgColor: "bg-blue-50 dark:bg-blue-500/20 border border-transparent dark:border-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  em_andamento: {
    icon: Activity,
    bgColor: "bg-amber-50 dark:bg-amber-500/20 border border-transparent dark:border-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  resolvidos: {
    icon: CheckCircle2,
    bgColor: "bg-emerald-50 dark:bg-emerald-500/20 border border-transparent dark:border-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  }
};

export default function KPICards({ data }) {
  const cards = [
    { key: "abertos", label: "Chamados Abertos", value: data?.abertos || 0, trend: data?.trendAbertos },
    { key: "em_andamento", label: "Em Andamento", value: data?.emAndamento || 0, trend: data?.trendEmAndamento },
    { key: "resolvidos", label: "Resolvidos", value: data?.resolvidos || 0, trend: data?.trendResolvidos },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const config = kpiConfig[card.key];
        const Icon = config.icon;
        const isPositive = card.trend > 0;
        const showTrend = card.trend !== undefined && card.trend !== 0;

        return (
          <Card
            key={card.key}
            // O segredo do efeito premium: bg-slate-800/50, borda mais clara (/50) e blur de fundo
            className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl backdrop-blur-sm"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-2">
                    {card.label}
                  </p>
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-none">
                    {card.value}
                  </p>

                  {showTrend && (
                    <div className={cn(
                      "flex items-center gap-1 mt-3 text-[11px] font-bold tracking-wide",
                      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {Math.abs(card.trend)}% vs mês anterior
                    </div>
                  )}
                </div>

                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", config.bgColor)}>
                  <Icon className={cn("w-6 h-6", config.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}