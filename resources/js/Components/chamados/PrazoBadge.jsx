import React from "react";
import { AlertTriangle, CalendarClock, CalendarX, CalendarCheck, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRAZO,
  formatPrazo,
  getPrazoDescricao,
  getPrazoSituacao,
  getPrazoTexto,
  diasAtePrazo,
} from "@/lib/prazoChamado";

const TAMANHOS = {
  xs: "text-[9px] px-1.5 py-0.5 gap-0.5 rounded",
  sm: "text-[11px] px-2 py-0.5 gap-1 rounded-md",
  md: "text-xs px-2.5 py-1 gap-1.5 rounded-lg",
};

const ICONE = { xs: "w-2.5 h-2.5", sm: "w-3 h-3", md: "w-3.5 h-3.5" };

/**
 * Selo de prazo de entrega, usado em todas as telas.
 *
 *  - no prazo:   "📅 15/11 · em 3 dias" (cinza)
 *  - vence hoje: âmbar
 *  - atrasado:   vermelho, com os dias de atraso
 *  - sem prazo:  tracejado (chamados antigos)
 *  - a definir:  chamado Aberto (ninguém assumiu)
 *  - encerrado:  só a data, apagada
 */
export default function PrazoBadge({ prazo, status, size = "sm", ocultarAberto = false, className }) {
  const situacao = getPrazoSituacao(prazo, status);
  const icone = ICONE[size] ?? ICONE.sm;
  const compacto = size === "xs";

  if (situacao === PRAZO.A_DEFINIR && ocultarAberto) return null;
  if (situacao === PRAZO.ENCERRADO && !prazo) return null;

  let classes = "";
  let Icone = CalendarClock;
  let texto = "";

  switch (situacao) {
    case PRAZO.ATRASADO: {
      const dias = Math.abs(diasAtePrazo(prazo));
      classes = "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 font-bold";
      Icone = AlertTriangle;
      texto = compacto ? `Atrasado ${dias}d` : `Atrasado há ${dias} ${dias === 1 ? "dia" : "dias"}`;
      break;
    }
    case PRAZO.VENCE_HOJE:
      classes = "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 font-bold";
      Icone = Hourglass;
      texto = "Vence hoje";
      break;
    case PRAZO.NO_PRAZO: {
      const desc = getPrazoDescricao(prazo, status).replace("vence ", "");
      classes = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold";
      texto = compacto ? formatPrazo(prazo, "dd/MM") : `${formatPrazo(prazo, "dd/MM")} · ${desc}`;
      break;
    }
    case PRAZO.SEM_PRAZO:
      classes = "border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-semibold";
      Icone = CalendarX;
      texto = "Sem prazo";
      break;
    case PRAZO.A_DEFINIR:
      classes = "bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 font-medium";
      texto = "A definir";
      break;
    case PRAZO.ENCERRADO:
      classes = "text-slate-400 dark:text-slate-500 font-medium";
      Icone = CalendarCheck;
      texto = formatPrazo(prazo, compacto ? "dd/MM" : "dd/MM/yyyy");
      break;
    default:
      return null;
  }

  return (
    <span
      title={`Prazo de entrega: ${getPrazoTexto(prazo, status)}`}
      className={cn("inline-flex items-center whitespace-nowrap leading-tight", TAMANHOS[size] ?? TAMANHOS.sm, classes, className)}
    >
      <Icone className={cn("shrink-0", icone)} />
      {texto}
    </span>
  );
}
