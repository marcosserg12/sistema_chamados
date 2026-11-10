// Fonte única das regras de prazo de entrega no frontend — espelha
// app/Support/PrazoChamado.php. Qualquer mudança nas regras precisa ser feita
// nos dois lugares.
//
// O prazo é só uma data ("2026-11-15"): o chamado vence no fim desse dia.

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { STATUS } from "@/lib/statusChamado";

export const PRAZO = {
  A_DEFINIR: "a_definir", // Aberto: ninguém assumiu ainda
  SEM_PRAZO: "sem_prazo", // pendente sem prazo (chamados de antes do prazo existir)
  NO_PRAZO: "no_prazo",
  VENCE_HOJE: "vence_hoje",
  ATRASADO: "atrasado",
  ENCERRADO: "encerrado", // Resolvido ou Cancelado
};

// Status em que o chamado está com um técnico e o prazo corre.
export const STATUS_COM_PRAZO = [STATUS.EM_ANDAMENTO, STATUS.AGUARDANDO_TESTE, STATUS.PAUSADO];
const STATUS_ENCERRADOS = [STATUS.RESOLVIDO, STATUS.CANCELADO];

export const MIN_JUSTIFICATIVA = 10;

// "2026-11-15" (ou "2026-11-15T03:00:00Z") -> Date local, sem escorregar de
// dia por causa do fuso (new Date("2026-11-15") seria meia-noite UTC).
export function parsePrazo(prazo) {
  if (!prazo) return null;
  const data = parseISO(String(prazo).slice(0, 10));
  return Number.isNaN(data.getTime()) ? null : data;
}

export function diasAtePrazo(prazo, hoje = new Date()) {
  const data = parsePrazo(prazo);
  return data ? differenceInCalendarDays(data, hoje) : null;
}

// A mudança de status coloca o chamado nas mãos de um técnico? Então o prazo
// é obrigatório (assumir um Aberto ou reabrir um Resolvido/Cancelado).
export function exigePrazo(de, para) {
  return STATUS_COM_PRAZO.includes(Number(para)) && !STATUS_COM_PRAZO.includes(Number(de));
}

export function getPrazoSituacao(prazo, status, hoje = new Date()) {
  const st = Number(status);
  if (STATUS_ENCERRADOS.includes(st)) return PRAZO.ENCERRADO;
  if (st === STATUS.ABERTO) return PRAZO.A_DEFINIR;

  const dias = diasAtePrazo(prazo, hoje);
  if (dias === null) return PRAZO.SEM_PRAZO;
  if (dias < 0) return PRAZO.ATRASADO;
  return dias === 0 ? PRAZO.VENCE_HOJE : PRAZO.NO_PRAZO;
}

// "vence hoje", "vence amanhã", "vence em 5 dias", "atrasado há 3 dias".
export function getPrazoDescricao(prazo, status, hoje = new Date()) {
  const situacao = getPrazoSituacao(prazo, status, hoje);
  if (![PRAZO.NO_PRAZO, PRAZO.VENCE_HOJE, PRAZO.ATRASADO].includes(situacao)) return "";

  const dias = diasAtePrazo(prazo, hoje);
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `vence em ${dias} dias`;

  const atraso = Math.abs(dias);
  return atraso === 1 ? "atrasado há 1 dia" : `atrasado há ${atraso} dias`;
}

export function formatPrazo(prazo, formato = "dd/MM/yyyy") {
  const data = parsePrazo(prazo);
  return data ? format(data, formato) : "";
}

// "15/11/2026 (vence em 3 dias)" — mesmo texto das mensagens.
export function getPrazoTexto(prazo, status) {
  const situacao = getPrazoSituacao(prazo, status);
  if (situacao === PRAZO.A_DEFINIR) return "A definir quando um técnico assumir";
  if (!parsePrazo(prazo)) return "Não definido";
  const descricao = getPrazoDescricao(prazo, status);
  return descricao ? `${formatPrazo(prazo)} (${descricao})` : formatPrazo(prazo);
}

// Data de hoje (+ N dias) no formato do <input type="date">.
export function dataISO(diasAFrente = 0) {
  return format(addDays(new Date(), diasAFrente), "yyyy-MM-dd");
}
