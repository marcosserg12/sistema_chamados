import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { Activity, CheckCircle2, Code2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { haQuanto } from "./ItemChamado";

const ABAS = [
    { id: "tudo", rotulo: "Tudo", icone: Activity },
    { id: "fechados", rotulo: "Fechados", icone: CheckCircle2 },
    { id: "andamento", rotulo: "Pegos", icone: Code2 },
];

const VERBO = { 0: "abriu/reabriu", 1: "pegou", 2: "mandou para teste", 3: "pausou", 8: "cancelou", 9: "resolveu" };

/**
 * Movimento recente da equipe, fixo do lado esquerdo da cena: tudo que mudou
 * de status, os últimos fechados e os últimos que alguém pegou para fazer.
 * Mudanças da última hora ganham destaque.
 */
export default function PainelMovimento({ dados, onSelecionarPessoa }) {
    const [aba, setAba] = useState("tudo");
    const [aberto, setAberto] = useState(false); // começa minimizado; o letreiro de baixo já mostra o movimento
    const idsEquipe = new Set(dados.pessoas.map((p) => p.id));

    const itens = {
        tudo: dados.eventos.map((e) => ({ chave: `e${e.id}`, id: e.id_chamado, titulo: e.titulo, status: e.status, cor: e.cor, quem: e.quem, idQuem: e.id_usuario, quando: e.quando })),
        fechados: (dados.ultimos_fechados ?? []).map((c) => ({ chave: `f${c.id}`, id: c.id, titulo: c.titulo, status: 9, cor: "#10b981", quem: c.quem, idQuem: c.id_quem, quando: c.quando, agora: c.status })),
        andamento: (dados.ultimos_em_andamento ?? []).map((c) => ({ chave: `a${c.id}`, id: c.id, titulo: c.titulo, status: 1, cor: "#f59e0b", quem: c.quem, idQuem: c.id_quem, quando: c.quando, agora: c.status })),
    }[aba];

    return (
        <div
            className={cn(
                "absolute left-3 top-14 z-10 w-[22rem] max-w-[calc(100%-1.5rem)] flex flex-col rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden",
                aberto ? "bottom-16" : ""
            )}
        >
            <button onClick={() => setAberto((v) => !v)} className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 text-left">
                <span className="relative flex w-2.5 h-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100">Movimento recente</span>
                {aberto ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {aberto && (
                <>
                    <div className="flex gap-1 p-2">
                        {ABAS.map(({ id, rotulo, icone: Icone }) => (
                            <button
                                key={id}
                                onClick={() => setAba(id)}
                                className={cn(
                                    "flex-1 inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition",
                                    aba === id ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <Icone className="w-3.5 h-3.5" /> {rotulo}
                            </button>
                        ))}
                    </div>
                    <ul className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
                        {itens.length === 0 && <li className="text-center text-sm text-slate-400 py-8">Nada por aqui ainda.</li>}
                        {itens.map((m) => {
                            const recente = Date.now() - new Date(m.quando).getTime() < 36e5;
                            return (
                                <li
                                    key={m.chave}
                                    className={cn(
                                        "rounded-lg border px-2.5 py-2",
                                        recente ? "border-indigo-200 bg-indigo-50/70 dark:border-indigo-500/40 dark:bg-indigo-500/10" : "border-slate-100 dark:border-slate-800"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 text-[13px]">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.cor }} />
                                        {m.idQuem && idsEquipe.has(m.idQuem) ? (
                                            <button onClick={() => onSelecionarPessoa(m.idQuem)} className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600">{m.quem}</button>
                                        ) : (
                                            <b className="text-slate-800 dark:text-slate-100">{m.quem}</b>
                                        )}
                                        <span className="text-slate-500 dark:text-slate-400">{VERBO[m.status] ?? "mudou"}</span>
                                        <Link href={`/chamados/${m.id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">#{m.id}</Link>
                                        {recente && <span className="ml-auto text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-300">novo</span>}
                                    </div>
                                    <Link href={`/chamados/${m.id}`} className="block mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-1 hover:text-indigo-600">
                                        {m.titulo}
                                    </Link>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        {haQuanto(m.quando)}
                                        {m.agora != null && m.agora !== m.status && " · já mudou de status"}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </div>
    );
}
