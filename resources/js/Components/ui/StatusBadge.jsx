import React from "react";
import { cn } from "@/lib/utils";

// Aceita tanto o código numérico usado no banco (0, 1, 9) quanto a chave textual.
const statusConfig = {
  0: { label: "Aberto", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" },
  1: { label: "Em Andamento", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30" },
  2: { label: "Aguardando Teste do Usuário", className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30" },
  3: { label: "Pausado/Aguardando Peça", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30" },
  8: { label: "Cancelado", className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/40" },
  9: { label: "Resolvido", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30" },
  aberto: { label: "Aberto", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" },
  em_andamento: { label: "Em Andamento", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30" },
  resolvido: { label: "Resolvido", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30" },
  fechado: { label: "Fechado", className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50" },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", className: "bg-slate-100 text-slate-600" },
  media: { label: "Média", className: "bg-blue-100 text-blue-600" },
  alta: { label: "Alta", className: "bg-amber-100 text-amber-600" },
  critica: { label: "Crítica", className: "bg-rose-100 text-rose-600" },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] ?? { label: "Desconhecido", className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50" };
  return (
    <span className={cn(
      "inline-flex items-center border px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap",
      config.className
    )}>
      {config.label}
    </span>
  );
}

export function PrioridadeBadge({ prioridade }) {
  const config = prioridadeConfig[prioridade] || prioridadeConfig.media;
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap",
      config.className
    )}>
      {config.label}
    </span>
  );
}
