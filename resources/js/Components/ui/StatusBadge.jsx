import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  aberto: { label: "Aberto", className: "bg-blue-100 text-blue-700 border-blue-200" },
  em_andamento: { label: "Em Andamento", className: "bg-amber-100 text-amber-700 border-amber-200" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", className: "bg-purple-100 text-purple-700 border-purple-200" },
  resolvido: { label: "Resolvido", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  fechado: { label: "Fechado", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", className: "bg-slate-100 text-slate-600" },
  media: { label: "Média", className: "bg-blue-100 text-blue-600" },
  alta: { label: "Alta", className: "bg-amber-100 text-amber-600" },
  critica: { label: "Crítica", className: "bg-rose-100 text-rose-600" },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.aberto;
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function PrioridadeBadge({ prioridade }) {
  const config = prioridadeConfig[prioridade] || prioridadeConfig.media;
  return (
    <Badge className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}