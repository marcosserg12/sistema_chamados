import React from "react";
import { Link } from "@inertiajs/react";
import { AlertTriangle, Hourglass, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Faixa fixa de prazos (sino e página de Notificações): quantos chamados da
 * pessoa estão atrasados e quantos vencem hoje, com link para a lista filtrada.
 * `prazos` vem de NotificationController::resumoPrazos().
 */
export default function FaixaPrazos({ prazos, className }) {
  if (!prazos || (!prazos.atrasados && !prazos.vence_hoje)) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch text-xs font-bold", className)}>
      {prazos.atrasados > 0 && (
        <Link
          href={prazos.url_atrasados}
          className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            {prazos.atrasados} {prazos.atrasados === 1 ? "chamado atrasado" : "chamados atrasados"}
          </span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </Link>
      )}
      {prazos.vence_hoje > 0 && (
        <Link
          href={prazos.url_vence_hoje}
          className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 transition-colors"
        >
          <Hourglass className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            {prazos.vence_hoje} {prazos.vence_hoje === 1 ? "vence hoje" : "vencem hoje"}
          </span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
        </Link>
      )}
    </div>
  );
}
