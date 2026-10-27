import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Maximize, Minimize, LocateFixed, HelpCircle, Users, RefreshCw } from "lucide-react";
import AppLayout from "@/Layouts/AppLayout";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { CenaEscritorio, idsLideres } from "@/Components/escritorio/cena";
import PainelPessoa, { Foto } from "@/Components/escritorio/PainelPessoa";
import PainelEquipe from "@/Components/escritorio/PainelEquipe";
import EditorAparencia from "@/Components/escritorio/EditorAparencia";
import PainelMovimento from "@/Components/escritorio/PainelMovimento";
import { haQuanto } from "@/Components/escritorio/ItemChamado";

const TEMPO_TV_POR_PESSOA = 12000;

function Chip({ rotulo, valor, cor, onClick }) {
    return (
        <button onClick={onClick} className="flex items-center gap-2 rounded-lg bg-white/85 dark:bg-slate-900/85 backdrop-blur px-2.5 py-1.5 shadow-sm border border-white/60 dark:border-slate-700/60 hover:shadow">
            <span className="w-2 h-2 rounded-full" style={{ background: cor }} />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{rotulo}</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{valor}</span>
        </button>
    );
}

function Legenda() {
    const itens = [
        ["📄", "Papéis na mesa = chamados na fila (cor = status)"],
        ["🖥️", "Monitor mostra o chamado em andamento"],
        ["🚨", "Luz vermelha = tem chamado atrasado"],
        ["🏆", "Troféu = quem mais resolveu nos últimos 7 dias"],
        ["🟢", "Crachá verde = mexeu no sistema há menos de 45 min"],
        ["💬", "Balões = mensagens do chat da equipe"],
        ["🎉", "Confete = chamado acabou de ser resolvido"],
        ["👔", "Renato sai da sala de tempos em tempos para passar nas baias"],
        ["☕", "De vez em quando alguém dá uma pausa na copa: café, água ou sofá"],
    ];
    return (
        <div className="absolute left-3 bottom-16 z-30 w-80 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xl border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Como ler o escritório</p>
            <ul className="space-y-1">
                {itens.map(([icone, texto]) => (
                    <li key={texto} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2"><span>{icone}</span>{texto}</li>
                ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">Arraste para girar · roda do mouse para zoom · clique numa baia, no painel da parede ou na triagem.</p>
        </div>
    );
}

const VERBO = { 0: "abriu", 1: "pegou", 2: "mandou para teste", 3: "pausou", 8: "cancelou", 9: "resolveu" };

/**
 * Letreiro em toda a largura do rodapé: passa pelas últimas movimentações,
 * uma de cada vez, a cada 5 s (pausa com o mouse em cima).
 */
function Letreiro({ eventos, onSelecionarPessoa }) {
    const [i, setI] = useState(0);
    const [pausado, setPausado] = useState(false);
    const lista = eventos.slice(0, 15);
    useEffect(() => {
        if (pausado) return;
        const t = setInterval(() => setI((v) => v + 1), 5000);
        return () => clearInterval(t);
    }, [pausado]);
    if (!lista.length) return <div className="flex-1" />;
    const pos = i % lista.length;
    const e = lista[pos];
    const recente = Date.now() - new Date(e.quando).getTime() < 36e5;
    return (
        <div
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            className="flex-1 min-w-0 h-10 flex items-center gap-3 rounded-lg bg-slate-900/90 text-slate-100 backdrop-blur px-3 shadow-lg overflow-hidden"
        >
            <span className="shrink-0 hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Movimento
            </span>
            <AnimatePresence mode="wait">
                <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="flex-1 min-w-0 truncate text-sm">
                    <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: e.cor }} />
                    {e.id_usuario ? (
                        <button onClick={() => onSelecionarPessoa(e.id_usuario)} className="font-bold hover:text-indigo-300">{e.quem}</button>
                    ) : (
                        <b>{e.quem}</b>
                    )}{" "}
                    <span className="text-slate-300">{VERBO[e.status] ?? "mudou"}</span>{" "}
                    <a href={`/chamados/${e.id_chamado}`} className="text-amber-300 font-semibold hover:underline">#{e.id_chamado}</a>{" "}
                    {e.titulo}
                    <span className="text-slate-400"> · {haQuanto(e.quando)}</span>
                    {recente && <span className="ml-2 text-[10px] font-bold uppercase text-indigo-300">novo</span>}
                </motion.div>
            </AnimatePresence>
            <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">{pos + 1}/{lista.length}</span>
        </div>
    );
}

export default function Escritorio({ inicial, podeEditarAparencia }) {
    const { auth } = usePage().props;
    const [dados, setDados] = useState(inicial);
    const [selecao, setSelecao] = useState(null); // id da pessoa, "equipe" ou null
    const [editando, setEditando] = useState(false);
    const [tv, setTv] = useState(() => new URLSearchParams(window.location.search).has("tv"));
    const [focoTv, setFocoTv] = useState(null);
    const [telaCheia, setTelaCheia] = useState(false);
    const [ajuda, setAjuda] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const moldura = useRef(null);
    const caixa = useRef(null);
    const cena = useRef(null);
    const editandoRef = useRef(false);
    editandoRef.current = editando;

    // Monta a cena uma vez
    useEffect(() => {
        cena.current = new CenaEscritorio(caixa.current, {
            aoSelecionar: (id) => {
                if (editandoRef.current) return;
                setSelecao(id);
            },
        });
        return () => cena.current.destruir();
    }, []);

    // Repassa os dados para a cena e avisa as novidades
    useEffect(() => {
        const novos = cena.current.atualizar(dados) ?? [];
        for (const e of novos.slice(0, 4)) {
            if (e.status === 9) toast.success(`🎉 ${e.quem} resolveu o #${e.id_chamado}`, { description: e.titulo });
            else if (e.status === 1) toast(`${e.quem} pegou o #${e.id_chamado}`, { description: e.titulo });
        }
    }, [dados]);

    // Atualização periódica (pausa enquanto o editor de aparência está aberto)
    const buscar = async () => {
        if (editandoRef.current) return;
        setAtualizando(true);
        try {
            const { data } = await axios.get("/api/escritorio");
            // Sessão expirada vira redirect para o login (HTML): ignora em vez de quebrar a tela.
            if (!Array.isArray(data?.pessoas)) return;
            if (!editandoRef.current) setDados(data);
        } catch (e) {
            // Mantém o último estado; tenta de novo no próximo ciclo.
        } finally {
            setAtualizando(false);
        }
    };
    useEffect(() => {
        const ms = (dados.config?.atualizar_a_cada_segundos ?? 30) * 1000;
        const t = setInterval(buscar, ms);
        return () => clearInterval(t);
    }, []);

    // Seleção -> câmera
    useEffect(() => {
        if (!cena.current) return;
        if (typeof selecao === "number") cena.current.selecionar(selecao);
        else if (selecao === "equipe") cena.current.selecionar(null);
        else cena.current.selecionar(null);
    }, [selecao]);

    // Modo TV: visão geral girando, depois passa por cada pessoa
    useEffect(() => {
        if (!cena.current) return;
        if (!tv) {
            cena.current.modoTV(false);
            setFocoTv(null);
            return;
        }
        setSelecao(null);
        const roteiro = [null, ...dados.pessoas.filter((p) => !p.chefe).map((p) => p.id)];
        let i = 0;
        const passo = () => {
            const id = roteiro[i % roteiro.length];
            if (id === null) {
                cena.current.modoTV(true);
            } else {
                cena.current.modoTV(false);
                cena.current.focar(id);
            }
            setFocoTv(id);
            i++;
        };
        passo();
        const t = setInterval(passo, TEMPO_TV_POR_PESSOA);
        return () => clearInterval(t);
    }, [tv]);

    useEffect(() => {
        const aoMudar = () => setTelaCheia(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", aoMudar);
        return () => document.removeEventListener("fullscreenchange", aoMudar);
    }, []);

    const alternarTelaCheia = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else moldura.current?.requestFullscreen?.();
    };

    const pessoaSel = typeof selecao === "number" ? dados.pessoas.find((p) => p.id === selecao) : null;
    const chefe = dados.pessoas.find((p) => p.chefe);
    const lideres = idsLideres(dados);
    const pessoaTv = focoTv ? dados.pessoas.find((p) => p.id === focoTv) : null;

    const previaAparencia = (id, aparencia) => {
        setDados((d) => ({ ...d, pessoas: d.pessoas.map((p) => (p.id === id ? { ...p, aparencia } : p)) }));
    };

    const painel = useMemo(() => {
        if (tv) return null;
        if (pessoaSel && editando) {
            return (
                <EditorAparencia
                    key={`editor-${pessoaSel.id}`}
                    pessoa={pessoaSel}
                    onPrevia={(ap) => previaAparencia(pessoaSel.id, ap)}
                    onFechar={() => setEditando(false)}
                    onSalvo={(ap) => {
                        previaAparencia(pessoaSel.id, ap);
                        setEditando(false);
                    }}
                />
            );
        }
        if (selecao === "equipe" || pessoaSel?.chefe) {
            return <PainelEquipe dados={dados} chefe={pessoaSel?.chefe ? pessoaSel : null} onSelecionar={setSelecao} onFechar={() => setSelecao(null)} />;
        }
        if (pessoaSel) {
            return (
                <PainelPessoa
                    key={pessoaSel.id}
                    pessoa={pessoaSel}
                    config={dados.config}
                    euId={auth.user.id_usuario}
                    lider={lideres.has(pessoaSel.id)}
                    podeEditar={podeEditarAparencia}
                    onEditar={() => setEditando(true)}
                    onFechar={() => setSelecao(null)}
                />
            );
        }
        return null;
    }, [tv, pessoaSel, editando, selecao, dados]);

    const k = dados.kpis;

    return (
        <AppLayout>
            <Head title="Escritório" />
            <div className="max-w-[1800px] mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Escritório da equipe</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Cada baia é uma pessoa: clique para ver a fila, o que está desenvolvendo e o que fechou por último.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={buscar} disabled={atualizando} title="Atualizar agora">
                            <RefreshCw className={cn("w-4 h-4", atualizando && "animate-spin")} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelecao(null); cena.current?.visaoGeral(); }}>
                            <LocateFixed className="w-4 h-4 mr-1.5" /> Visão geral
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelecao("equipe")}>
                            <Users className="w-4 h-4 mr-1.5" /> Equipe
                        </Button>
                        <Button variant={tv ? "default" : "outline"} size="sm" onClick={() => setTv((v) => !v)} className={cn(tv && "bg-indigo-600 hover:bg-indigo-700")}>
                            <Tv className="w-4 h-4 mr-1.5" /> Modo TV
                        </Button>
                        <Button variant="outline" size="sm" onClick={alternarTelaCheia} title="Tela cheia">
                            {telaCheia ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                <div
                    ref={moldura}
                    className={cn(
                        "relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900",
                        telaCheia ? "h-screen rounded-none" : "h-[calc(100vh-11rem)] min-h-[520px] rounded-2xl"
                    )}
                >
                    <div ref={caixa} className="absolute inset-0" />

                    {/* Números no topo */}
                    <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 max-w-[calc(100%-1.5rem)] pointer-events-auto">
                        <Chip rotulo="Sem responsável" valor={k.sem_responsavel} cor="#3b82f6" onClick={() => setSelecao("equipe")} />
                        <Chip rotulo="Em andamento" valor={k.em_andamento} cor="#f59e0b" onClick={() => setSelecao("equipe")} />
                        <Chip rotulo="Aguard. teste" valor={k.aguardando_teste} cor="#a855f7" onClick={() => setSelecao("equipe")} />
                        <Chip rotulo="Atrasados" valor={k.atrasados} cor="#ef4444" onClick={() => setSelecao("equipe")} />
                        <Chip rotulo="Resolvidos hoje" valor={k.resolvidos_hoje} cor="#10b981" onClick={() => setSelecao("equipe")} />
                    </div>

                    <PainelMovimento dados={dados} onSelecionarPessoa={setSelecao} />

                    {/* Rodapé em toda a largura: legenda + letreiro do movimento recente */}
                    <div className={cn("absolute bottom-3 left-3 z-10 flex items-center gap-2", painel ? "right-[26rem] max-md:right-3" : "right-3")}>
                        <button
                            onClick={() => setAjuda((v) => !v)}
                            className="shrink-0 w-10 h-10 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow flex items-center justify-center text-slate-600 dark:text-slate-300"
                            aria-label="Legenda"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <Letreiro eventos={dados.eventos} onSelecionarPessoa={setSelecao} />
                    </div>
                    {ajuda && <Legenda />}

                    {/* Painel lateral */}
                    <AnimatePresence>
                        {painel && (
                            <motion.aside
                                key="painel"
                                initial={{ x: 40, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 40, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="absolute top-3 right-3 bottom-3 z-20 w-[25rem] max-w-[calc(100%-1.5rem)] rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                                {painel}
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Cartão do modo TV */}
                    <AnimatePresence>
                        {tv && pessoaTv && (
                            <motion.div
                                key={pessoaTv.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="absolute right-3 bottom-16 z-20 w-96 max-w-[calc(100%-1.5rem)] rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl border border-slate-200 dark:border-slate-700 p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <Foto pessoa={pessoaTv} />
                                    <div className="min-w-0">
                                        <p className="font-bold text-lg text-slate-900 dark:text-white truncate">{pessoaTv.nome}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {pessoaTv.contagem.fila} na fila · {pessoaTv.resolvidos.sete_dias} resolvidos em 7 dias
                                        </p>
                                    </div>
                                </div>
                                {pessoaTv.atual ? (
                                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                                        <span className="font-bold text-amber-600">Agora: #{pessoaTv.atual.id}</span> {pessoaTv.atual.titulo}
                                    </p>
                                ) : (
                                    <p className="mt-3 text-sm text-slate-500">Nenhum chamado em andamento.</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AppLayout>
    );
}
