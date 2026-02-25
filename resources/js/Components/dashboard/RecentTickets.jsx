import React from "react";
import { Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { PrioridadeBadge } from "@/Components/ui/StatusBadge";
import { Ticket, ArrowRight, Calendar, Clock, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";

// Suporte completo ao Modo Escuro nos Badges
const renderStatusBadge = (statusId) => {
  const status = Number(statusId);
  if (status === 1) {
    return <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">Em Andamento</span>;
  }
  if (status === 0) {
    return <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">Aberto</span>;
  }
  if (status === 9) {
    return <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">Resolvido</span>;
  }
  return <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Status {status}</span>;
};

export default function RecentTickets({ chamados = [] }) {
  return (
    <Card className="shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
          <Ticket className="w-5 h-5 text-indigo-500" />
          Últimos Chamados
        </CardTitle>
        <Link href="/chamados">
          <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800">
            Ver todos
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {chamados.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 font-medium">
              Nenhum chamado encontrado.
            </p>
          )}

          {chamados.slice(0, 10).map((chamado) => {
            let dataFormatada = "--/--/----";
            let horaFormatada = "--:--";

            if (chamado.dt_data_chamado) {
              try {
                const dateObj = parseISO(chamado.dt_data_chamado);
                dataFormatada = format(dateObj, 'dd/MM/yyyy');
                horaFormatada = format(dateObj, 'HH:mm');
              } catch(e) {}
            }

            return (
              <Link
                key={chamado.id_chamado}
                href={`/chamados/${chamado.id_chamado}`}
                className="block group"
              >
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md transition-all duration-200">

                  {/* Lado Esquerdo: ID, Título e Datas */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        #{chamado.id_chamado}
                      </span>
                      {chamado.prioridade && <PrioridadeBadge prioridade={chamado.prioridade} />}
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {chamado.ds_titulo || chamado.titulo || `Solicitação #${chamado.id_chamado}`}
                    </h4>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      {chamado.motivo_associado?.ds_descricao_motivo && (
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{chamado.motivo_associado.ds_descricao_motivo}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dataFormatada}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{horaFormatada}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Status */}
                  <div className="flex items-center shrink-0">
                    {renderStatusBadge(chamado.st_status)}
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}