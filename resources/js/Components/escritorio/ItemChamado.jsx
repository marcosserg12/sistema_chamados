import React from "react";
import { Link } from "@inertiajs/react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, Clock } from "lucide-react";
import { StatusBadge } from "@/Components/ui/StatusBadge";
import { cn } from "@/lib/utils";

export const haQuanto = (iso) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR }) : "");

export function duracao(horas) {
    if (horas == null) return "–";
    if (horas < 1) return `${Math.round(horas * 60)} min`;
    if (horas < 48) return `${horas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;
    return `${(horas / 24).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`;
}

/**
 * Linha de chamado dos painéis do escritório. `modo` decide a linha de
 * informação: fila (idade e previsão), desenvolvendo (quando começou) ou
 * fechado (quando resolveu e quanto levou).
 */
export default function ItemChamado({ chamado: c, modo = "fila", horasAtraso = 48, extra }) {
    const idadeHoras = (Date.now() - new Date(c.aberto_em).getTime()) / 36e5;
    // Aguardando teste e pausado não contam como atraso (dependem de fora da equipe).
    const atrasado = modo === "fila" && [0, 1].includes(c.status) && idadeHoras > horasAtraso;
    return (
        <Link
            href={`/chamados/${c.id}`}
            className={cn(
                "group block rounded-lg border bg-white dark:bg-slate-900 px-3 py-2.5 transition hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-500/50",
                atrasado ? "border-rose-200 dark:border-rose-500/30" : "border-slate-200 dark:border-slate-800"
            )}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-4 rounded-full shrink-0" style={{ background: c.cor }} />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">#{c.id}</span>
                <span className="ml-auto"><StatusBadge status={c.status} /></span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                {c.titulo}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                {c.empresa && <span className="truncate max-w-[10rem]">{c.empresa}</span>}
                {c.solicitante && <span>por {c.solicitante}</span>}
                {modo === "fila" && (
                    <span className={cn("inline-flex items-center gap-1", atrasado && "text-rose-600 dark:text-rose-400 font-semibold")}>
                        <Clock className="w-3 h-3" /> aberto {haQuanto(c.aberto_em)}
                    </span>
                )}
                {modo === "fila" && c.previsao && (
                    <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> previsão {format(new Date(c.previsao), "dd/MM")}
                    </span>
                )}
                {modo === "desenvolvendo" && c.iniciado_em && <span>começou {haQuanto(c.iniciado_em)}</span>}
                {modo === "fechado" && (
                    <span>
                        resolvido {haQuanto(c.resolvido_em)} · levou {duracao(c.duracao_horas)}
                    </span>
                )}
                {extra}
            </div>
        </Link>
    );
}
