import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { StatusBadge, PrioridadeBadge } from "@/Components/ui/StatusBadge";
import { Ticket, ArrowRight, Calendar, Clock, Tag, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function RecentTickets({ chamados = [] }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    router.reload({
      only: ["chamadosRecentes"],
      onStart: () => setRefreshing(true),
      onFinish: () => setRefreshing(false),
    });
  };

  return (
    <Card className="shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/60 mb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
          <Ticket className="w-5 h-5 text-blue-500" />
          Últimos Chamados
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Atualizar lista"
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 h-8 w-8"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
          <Link href="/chamados">
            <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
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
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all duration-200">

                  {/* Lado Esquerdo: ID, Título e Datas */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        #{chamado.id_chamado}
                      </span>
                      {chamado.prioridade && <PrioridadeBadge prioridade={chamado.prioridade} />}
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {chamado.ds_titulo || chamado.titulo || `Solicitação #${chamado.id_chamado}`}
                    </h4>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      {chamado.motivo_associado?.ds_descricao_motivo && (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
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
                    <StatusBadge status={Number(chamado.st_status)} />
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