// Fonte única de verdade para status de chamado no frontend — espelha
// app/Support/StatusChamado.php. Qualquer mudança nos status precisa ser
// feita nos dois lugares.

export const STATUS = {
  ABERTO: 0,
  EM_ANDAMENTO: 1,
  AGUARDANDO_TESTE: 2,
  PAUSADO: 3,
  CANCELADO: 8,
  RESOLVIDO: 9,
};

// Ordem de exibição em listas/filtros.
export const STATUS_LIST = [
  { value: STATUS.ABERTO, label: "Aberto" },
  { value: STATUS.EM_ANDAMENTO, label: "Em Andamento" },
  { value: STATUS.AGUARDANDO_TESTE, label: "Aguardando Teste do Usuário" },
  { value: STATUS.PAUSADO, label: "Pausado/Aguardando Peça" },
  { value: STATUS.CANCELADO, label: "Cancelado" },
  { value: STATUS.RESOLVIDO, label: "Resolvido" },
];

// Os 3 status principais (90% dos casos) — usados no Kanban e como ações
// primárias. Os demais ficam separados, num seletor à parte.
export const STATUS_PRINCIPAIS = [STATUS.ABERTO, STATUS.EM_ANDAMENTO, STATUS.RESOLVIDO];
export const STATUS_SECUNDARIOS = [STATUS.AGUARDANDO_TESTE, STATUS.PAUSADO, STATUS.CANCELADO];

const LABELS = Object.fromEntries(STATUS_LIST.map((s) => [s.value, s.label]));

export function getStatusLabel(status) {
  return LABELS[Number(status)] ?? "Outro";
}

// Classes Tailwind (badge: fundo + texto) por status, claro/escuro.
const BADGE_CLASSES = {
  [STATUS.ABERTO]: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  [STATUS.EM_ANDAMENTO]: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  [STATUS.AGUARDANDO_TESTE]: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  [STATUS.PAUSADO]: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  [STATUS.CANCELADO]: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400",
  [STATUS.RESOLVIDO]: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export function getStatusBadgeClass(status) {
  return BADGE_CLASSES[Number(status)] ?? "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400";
}

// Cor sólida (dot indicator, gráficos) por status.
const DOT_CLASSES = {
  [STATUS.ABERTO]: "bg-blue-500",
  [STATUS.EM_ANDAMENTO]: "bg-amber-500",
  [STATUS.AGUARDANDO_TESTE]: "bg-purple-500",
  [STATUS.PAUSADO]: "bg-orange-500",
  [STATUS.CANCELADO]: "bg-slate-400",
  [STATUS.RESOLVIDO]: "bg-emerald-500",
};

export function getStatusDotClass(status) {
  return DOT_CLASSES[Number(status)] ?? "bg-slate-400";
}
