import React, { useState } from "react";
import { X, Trophy, AlertTriangle, Inbox, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Foto } from "./PainelPessoa";
import ItemChamado from "./ItemChamado";

const PARTES_CARGA = [
    ["andamento", "#f59e0b", "em andamento"],
    ["teste", "#a855f7", "aguardando teste"],
    ["pausados", "#f97316", "pausados"],
    ["abertos", "#3b82f6", "abertos"],
];

function Kpi({ rotulo, valor, cor }) {
    return (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{rotulo}</div>
            <div className="text-xl font-bold" style={{ color: cor }}>{valor}</div>
        </div>
    );
}

/**
 * Visão da coordenação: abre ao clicar no Renato, no painel da parede ou na
 * mesa de triagem. Mostra a carga de cada um, atrasados, a fila sem dono e
 * o ranking da semana.
 */
export default function PainelEquipe({ dados, chefe, onSelecionar, onFechar }) {
    const [aba, setAba] = useState("atrasados");
    const k = dados.kpis;
    const equipe = dados.pessoas.filter((p) => !p.chefe);
    const maxFila = Math.max(1, ...equipe.map((p) => p.contagem.fila));
    const listas = { atrasados: dados.atrasados, triagem: dados.triagem };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                    {chefe ? (
                        <div className="relative">
                            <Foto pessoa={chefe} className="border-amber-300" />
                            <Crown className="absolute -top-2 -right-1 w-5 h-5 text-amber-500 drop-shadow" />
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-slate-900 dark:text-white truncate">{chefe ? chefe.nome : "Visão da equipe"}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {chefe ? "Coordenação · acompanha a equipe toda" : "Números de agora, de todos os chamados"}
                        </p>
                    </div>
                    <button onClick={onFechar} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Fechar">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                    <Kpi rotulo="Sem responsável" valor={k.sem_responsavel} cor="#3b82f6" />
                    <Kpi rotulo="Em andamento" valor={k.em_andamento} cor="#f59e0b" />
                    <Kpi rotulo="Atrasados" valor={k.atrasados} cor="#ef4444" />
                    <Kpi rotulo="Aguard. teste" valor={k.aguardando_teste} cor="#a855f7" />
                    <Kpi rotulo="Abertos hoje" valor={k.abertos_hoje} cor="#64748b" />
                    <Kpi rotulo="Resolvidos hoje" valor={k.resolvidos_hoje} cor="#10b981" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <section className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Carga de cada um</h3>
                    <div className="space-y-2">
                        {[...equipe].sort((a, b) => b.contagem.fila - a.contagem.fila).map((p) => (
                            <button key={p.id} onClick={() => onSelecionar(p.id)} className="w-full flex items-center gap-2 group text-left">
                                <Foto pessoa={p} className="w-7 h-7 border shadow-none" />
                                <span className="w-24 text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600" title={p.setor === "infra" ? "Infraestrutura" : undefined}>
                                    {p.apelido}{p.setor === "infra" && <span className="ml-1 text-[9px] font-bold text-emerald-600">INFRA</span>}
                                </span>
                                <span className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex" title={PARTES_CARGA.map(([c, , r]) => `${p.contagem[c]} ${r}`).join(" · ")}>
                                    {PARTES_CARGA.map(([campo, cor]) => (
                                        <span key={campo} style={{ width: `${(p.contagem[campo] / maxFila) * 100}%`, background: cor }} />
                                    ))}
                                </span>
                                <span className="w-6 text-right text-sm font-bold text-slate-700 dark:text-slate-200">{p.contagem.fila}</span>
                                {p.contagem.atrasados > 0 && (
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 w-8">{p.contagem.atrasados}⚠</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                        {PARTES_CARGA.map(([c, cor, r]) => (
                            <span key={c} className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: cor }} />{r}</span>
                        ))}
                    </div>
                </section>

                <section className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> Quem mais resolveu (7 dias)
                    </h3>
                    {dados.ranking_sete_dias.length === 0 && <p className="text-sm text-slate-400">Ninguém resolveu nada nos últimos 7 dias ainda.</p>}
                    <ol className="space-y-1">
                        {dados.ranking_sete_dias.slice(0, 5).map((r, i) => (
                            <li key={r.id}>
                                <button onClick={() => onSelecionar(r.id)} className="w-full flex items-center gap-2 text-sm hover:text-indigo-600">
                                    <span className="w-5 text-center">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</span>
                                    <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200">{r.nome}</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.total}</span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="p-4">
                    <div className="flex gap-1 mb-3">
                        {[
                            ["atrasados", `Atrasados (${dados.atrasados.length})`, AlertTriangle],
                            ["triagem", `Sem responsável (${dados.triagem.length})`, Inbox],
                        ].map(([id, rotulo, Icone]) => (
                            <button
                                key={id}
                                onClick={() => setAba(id)}
                                className={cn(
                                    "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition",
                                    aba === id ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <Icone className="w-3.5 h-3.5" /> {rotulo}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {listas[aba].length === 0 && <p className="text-center text-sm text-slate-400 py-6">Nada aqui 🎉</p>}
                        {listas[aba].map((c) => (
                            <ItemChamado
                                key={c.id}
                                chamado={c}
                                modo="fila"
                                horasAtraso={dados.config.horas_atraso}
                                extra={aba === "atrasados" && <span className="font-semibold text-slate-600 dark:text-slate-300">{c.tecnico ? `com ${c.tecnico}` : "sem responsável"}</span>}
                            />
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
