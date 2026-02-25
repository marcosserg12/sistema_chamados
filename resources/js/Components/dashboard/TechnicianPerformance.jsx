import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

export default function TechnicianPerformance({ tecnicos = [] }) {
  const getInitials = (name) => {
    if (!name) return "T";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card className="h-full shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/50 mb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-slate-400" />
          Equipe Técnica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!tecnicos || tecnicos.length === 0) && (
          <p className="text-sm text-slate-500 text-center py-6">
            Nenhum técnico cadastrado
          </p>
        )}

        {tecnicos.map((tecnico) => {
          const ativos = tecnico.chamados_ativos || 0;
          const resolvidos = tecnico.chamados_resolvidos || 0;
          const total = ativos + resolvidos;
          const resolvidosPercent = total > 0 ? (resolvidos / total) * 100 : 0;

          return (
            <div key={tecnico.id || tecnico.nome} className="flex items-center gap-4">
              <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-700">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                  {getInitials(tecnico.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {tecnico.nome}
                  </p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {ativos} ativos
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={resolvidosPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {resolvidos} resolvidos
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}