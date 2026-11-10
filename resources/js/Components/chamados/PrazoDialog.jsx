import React, { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { cn } from "@/lib/utils";
import { MIN_JUSTIFICATIVA, dataISO, formatPrazo, parsePrazo } from "@/lib/prazoChamado";

const ATALHOS = [
  { rotulo: "Hoje", dias: 0 },
  { rotulo: "Amanhã", dias: 1 },
  { rotulo: "+2 dias", dias: 2 },
  { rotulo: "+1 semana", dias: 7 },
];

/**
 * Janela de prazo de entrega.
 *
 *  modo "assumir": prazo obrigatório para assumir/atribuir o chamado.
 *  modo "definir": primeiro prazo de um chamado antigo (sem justificativa).
 *  modo "alterar": troca o prazo existente — justificativa obrigatória.
 */
export default function PrazoDialog({
  open,
  onOpenChange,
  modo = "assumir",
  titulo,
  descricao,
  prazoAtual = null,
  processing = false,
  erro = null,
  onConfirmar,
}) {
  const [data, setData] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (open) {
      setData("");
      setJustificativa("");
      setTocado(false);
    }
  }, [open]);

  const hoje = dataISO(0);
  const alterando = modo === "alterar";
  const justificativaOk = !alterando || justificativa.trim().length >= MIN_JUSTIFICATIVA;
  const dataPassada = data && data < hoje;
  const mesmaData = alterando && prazoAtual && data === String(prazoAtual).slice(0, 10);
  const dataOk = !!parsePrazo(data) && !dataPassada && !mesmaData;
  const podeConfirmar = dataOk && justificativaOk && !processing;

  const tituloPadrao = {
    assumir: "Prazo de entrega",
    definir: "Definir prazo de entrega",
    alterar: "Alterar prazo de entrega",
  }[modo];

  const descricaoPadrao = {
    assumir: "Para assumir o chamado, informe até quando ele será entregue. O solicitante recebe esse prazo.",
    definir: "Este chamado ainda não tem prazo. Informe até quando ele será entregue.",
    alterar: "O novo prazo e a justificativa ficam no histórico do chamado e são enviados ao solicitante.",
  }[modo];

  const rotuloConfirmar = {
    assumir: data && dataOk ? `Confirmar com prazo até ${formatPrazo(data, "dd/MM")}` : "Confirmar",
    definir: "Definir prazo",
    alterar: "Salvar novo prazo",
  }[modo];

  const confirmar = (e) => {
    e?.preventDefault();
    setTocado(true);
    if (!podeConfirmar) return;
    onConfirmar?.({ dt_prazo: data, ds_justificativa: alterando ? justificativa.trim() : null });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !processing && onOpenChange?.(v)}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <form onSubmit={confirmar} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <CalendarClock className="w-5 h-5 text-indigo-500" />
              {titulo || tituloPadrao}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {descricao || descricaoPadrao}
            </DialogDescription>
          </DialogHeader>

          {alterando && prazoAtual && (
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
              Prazo atual: <span className="text-slate-800 dark:text-slate-200">{formatPrazo(prazoAtual)}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="prazo-data" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {alterando ? "Novo prazo" : "Entregar até"}
            </label>
            <Input
              id="prazo-data"
              type="date"
              min={hoje}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-11 font-semibold dark:bg-slate-800 dark:border-slate-700"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {ATALHOS.map((a) => {
                const valor = dataISO(a.dias);
                return (
                  <button
                    key={a.rotulo}
                    type="button"
                    onClick={() => setData(valor)}
                    className={cn(
                      "text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors",
                      data === valor
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
                    )}
                  >
                    {a.rotulo}
                  </button>
                );
              })}
            </div>
            {tocado && !data && <p className="text-xs font-medium text-rose-600">Escolha a data do prazo.</p>}
            {dataPassada && <p className="text-xs font-medium text-rose-600">O prazo não pode ser uma data que já passou.</p>}
            {mesmaData && <p className="text-xs font-medium text-rose-600">Escolha uma data diferente do prazo atual.</p>}
          </div>

          {alterando && (
            <div className="space-y-2">
              <label htmlFor="prazo-justificativa" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Justificativa
              </label>
              <Textarea
                id="prazo-justificativa"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Por que o prazo está mudando?"
                className="min-h-[90px] resize-none dark:bg-slate-800 dark:border-slate-700"
                maxLength={1000}
              />
              <p className={cn("text-[11px] font-medium", tocado && !justificativaOk ? "text-rose-600" : "text-slate-400")}>
                {justificativa.trim().length < MIN_JUSTIFICATIVA
                  ? `Mínimo de ${MIN_JUSTIFICATIVA} caracteres (${justificativa.trim().length}/${MIN_JUSTIFICATIVA}).`
                  : "Vai para o histórico e para a mensagem do solicitante."}
              </p>
            </div>
          )}

          {erro && (
            <p className="text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{erro}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!podeConfirmar} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {rotuloConfirmar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
