import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { X, Palette, Kanban, Trophy, AlertTriangle, Inbox, Timer, CheckCircle2, Code2, ImageOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { iniciais } from "./texturas";
import ItemChamado, { haQuanto, duracao } from "./ItemChamado";

export function Foto({ pessoa, className }) {
    return (
        <Avatar className={cn("w-14 h-14 border-2 border-white dark:border-slate-800 shadow", className)}>
            {pessoa.foto ? (
                <img src={pessoa.foto} className="aspect-square h-full w-full object-cover" alt="" />
            ) : (
                <AvatarFallback className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold">
                    {iniciais(pessoa.nome)}
                </AvatarFallback>
            )}
        </Avatar>
    );
}

function Numero({ icone: Icone, valor, rotulo, cor }) {
    return (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2">
            <div className={cn("flex items-center gap-1 text-[11px] font-medium", cor)}>
                <Icone className="w-3.5 h-3.5" /> {rotulo}
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{valor}</div>
        </div>
    );
}

export default function PainelPessoa({ pessoa: p, config, euId, lider, podeEditar, onEditar, onFechar }) {
    const [aba, setAba] = useState("fila");
    const abas = [
        { id: "fila", rotulo: "Fila", n: p.fila.length },
        { id: "desenvolvendo", rotulo: "Em desenvolvimento", n: p.desenvolvendo.length },
        { id: "fechados", rotulo: "Fechados", n: p.fechados.length },
    ];
    const lista = { fila: p.fila, desenvolvendo: p.desenvolvendo, fechados: p.fechados }[aba];
    const sobrecarregado = p.contagem.fila >= config.fila_sobrecarga;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                    <div className="relative">
                        <Foto pessoa={p} />
                        <span
                            className={cn(
                                "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900",
                                p.ativo_recente ? "bg-emerald-500" : "bg-slate-400"
                            )}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-slate-900 dark:text-white truncate">{p.nome}</h2>
                            {p.id === euId && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">você</span>
                            )}
                            {p.setor === "infra" && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">infra</span>
                            )}
                            {lider && <Trophy className="w-4 h-4 text-amber-500 shrink-0" title="Mais resolveu nos últimos 7 dias" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {p.ativo_recente
                                ? "Mexeu no sistema agora há pouco"
                                : p.ultima_atividade
                                  ? `Última atividade ${haQuanto(p.ultima_atividade)}`
                                  : "Sem atividade nos últimos 7 dias"}
                        </p>
                    </div>
                    <button onClick={onFechar} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Fechar">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {p.atual && (
                    <Link href={`/chamados/${p.atual.id}`} className="mt-3 block rounded-lg bg-slate-900 dark:bg-black/40 text-slate-100 p-3 hover:ring-2 hover:ring-amber-400/60 transition">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
                            <Code2 className="w-3.5 h-3.5" /> Trabalhando agora
                        </div>
                        <p className="mt-1 text-sm font-medium leading-snug line-clamp-2">
                            <span className="text-amber-300 font-bold">#{p.atual.id}</span> {p.atual.titulo}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">{p.atual.empresa} · mexido {haQuanto(p.atual.atualizado_em)}</p>
                    </Link>
                )}

                <div className="mt-3 grid grid-cols-4 gap-2">
                    <Numero icone={Inbox} valor={p.contagem.fila} rotulo="Fila" cor={sobrecarregado ? "text-rose-600" : "text-blue-600 dark:text-blue-400"} />
                    <Numero icone={AlertTriangle} valor={p.contagem.atrasados} rotulo="Atrasos" cor={p.contagem.atrasados ? "text-rose-600 dark:text-rose-400" : "text-slate-500"} />
                    <Numero icone={CheckCircle2} valor={p.resolvidos.sete_dias} rotulo="7 dias" cor="text-emerald-600 dark:text-emerald-400" />
                    <Numero icone={Timer} valor={duracao(p.tempo_medio_horas)} rotulo="Média" cor="text-violet-600 dark:text-violet-400" />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Resolvidos: <b>{p.resolvidos.hoje}</b> hoje · <b>{p.resolvidos.mes}</b> no mês
                    {p.contagem.teste > 0 && <> · <b>{p.contagem.teste}</b> aguardando teste</>}
                    {p.contagem.pausados > 0 && <> · <b>{p.contagem.pausados}</b> pausado(s)</>}
                </p>
                {!p.foto && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                        <ImageOff className="w-3.5 h-3.5" /> Sem foto de perfil: o boneco está genérico.
                    </p>
                )}
            </div>

            <div className="flex gap-1 px-3 pt-3">
                {abas.map((a) => (
                    <button
                        key={a.id}
                        onClick={() => setAba(a.id)}
                        className={cn(
                            "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition",
                            aba === a.id
                                ? "bg-indigo-600 text-white"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        {a.rotulo} <span className={cn("ml-0.5", aba === a.id ? "text-indigo-200" : "text-slate-400")}>{a.n}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {lista.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-10">
                        {aba === "fila" ? "Fila zerada 🎉" : aba === "desenvolvendo" ? "Nada colocado em andamento nos últimos 30 dias." : "Nenhum chamado fechado nos últimos 45 dias."}
                    </p>
                )}
                {lista.map((c) => (
                    <ItemChamado key={`${aba}-${c.id}`} chamado={c} modo={aba === "fechados" ? "fechado" : aba} horasAtraso={config.horas_atraso} />
                ))}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/board"><Kanban className="w-4 h-4 mr-1.5" /> Quadro de tarefas</Link>
                </Button>
                {podeEditar && (
                    <Button variant="outline" size="sm" onClick={onEditar}>
                        <Palette className="w-4 h-4 mr-1.5" /> Aparência
                    </Button>
                )}
            </div>
        </div>
    );
}
