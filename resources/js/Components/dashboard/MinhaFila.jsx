import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import Swal from "sweetalert2";
import { GripVertical, AlertCircle, Clock, CheckCircle2, RefreshCw, ChevronDown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STATUS, getStatusBadgeClass, getStatusDotClass, getStatusLabel } from "@/lib/statusChamado";
import { STATUS_COM_PRAZO, exigePrazo, formatPrazo, getPrazoTexto } from "@/lib/prazoChamado";
import PrazoBadge from "@/Components/chamados/PrazoBadge";
import PrazoDialog from "@/Components/chamados/PrazoDialog";

// Opções do menu de status da fila. "Aberto" fica separado: devolve o chamado
// para a fila geral (sem técnico e sem prazo).
const OPCOES_STATUS = [
    STATUS.EM_ANDAMENTO,
    STATUS.AGUARDANDO_TESTE,
    STATUS.PAUSADO,
    STATUS.RESOLVIDO,
    STATUS.CANCELADO,
];

// Status que tiram o chamado da "minha fila" (só pendentes com técnico aparecem nela).
const SAEM_DA_FILA = [STATUS.ABERTO, STATUS.RESOLVIDO, STATUS.CANCELADO];

const primeiroErro = (errors) => Object.values(errors || {})[0] || null;

const MinhaFila = ({ chamadosFila }) => {
    const [items, setItems] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [alterandoId, setAlterandoId] = useState(null);

    // Janela de prazo: "definir"/"alterar" (selo de prazo) ou "assumir"
    // (mudança de status que exige prazo).
    const [prazoDialog, setPrazoDialog] = useState({ open: false, modo: "alterar", chamado: null, novoStatus: null, erro: null });
    const [prazoProcessando, setPrazoProcessando] = useState(false);

    // Atualiza o estado quando os props mudam
    useEffect(() => {
        setItems(chamadosFila || []);
    }, [chamadosFila]);

    const onDragEnd = async (result) => {
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) {
            return;
        }

        const newItems = Array.from(items);
        const [reorderedItem] = newItems.splice(sourceIndex, 1);
        newItems.splice(destinationIndex, 0, reorderedItem);

        // Atualiza UI instantaneamente
        setItems(newItems);

        // Envia para o servidor
        const chamadosOderIds = newItems.map(item => item.id_chamado);
        setIsSaving(true);
        try {
            await axios.post(route('chamados.reordenar'), {
                chamados: chamadosOderIds
            });
            toast.success("Ordem da fila salva com sucesso!");
        } catch (error) {
            console.error("Erro ao reordenar fila:", error);
            // Reverte em caso de erro
            setItems(items);
            toast.error("Falha ao salvar a nova ordem.");
        } finally {
            setIsSaving(false);
        }
    };

    // Recarrega só a fila (sem recarregar a página toda).
    const atualizarFila = () => {
        router.reload({
            only: ["minhaFila"],
            preserveScroll: true,
            onStart: () => setAtualizando(true),
            onFinish: () => setAtualizando(false),
        });
    };

    const salvarStatus = (chamado, novoStatus, dtPrazo = null, aoTerminar = {}) => {
        const dados = dtPrazo ? { st_status: novoStatus, dt_prazo: dtPrazo } : { st_status: novoStatus };

        router.put(`/chamados/${chamado.id_chamado}`, dados, {
            preserveScroll: true,
            onStart: () => setAlterandoId(chamado.id_chamado),
            onSuccess: () => {
                toast.success(
                    SAEM_DA_FILA.includes(novoStatus)
                        ? `#${chamado.id_chamado} agora está como "${getStatusLabel(novoStatus)}" e saiu da sua fila.`
                        : `#${chamado.id_chamado} agora está como "${getStatusLabel(novoStatus)}".`
                );
                aoTerminar.onSuccess?.();
            },
            onError: (errors) => {
                const msg = primeiroErro(errors) || "Erro ao atualizar o status.";
                if (aoTerminar.onError) aoTerminar.onError(msg);
                else toast.error(msg);
            },
            onFinish: () => {
                setAlterandoId(null);
                aoTerminar.onFinish?.();
            },
        });
    };

    const mudarStatus = (chamado, novoStatus) => {
        if (Number(chamado.st_status) === novoStatus) return;

        // Mesma regra da tela do chamado: se a mudança faz alguém assumir o
        // chamado, o prazo é obrigatório.
        if (exigePrazo(chamado.st_status, novoStatus)) {
            setPrazoDialog({ open: true, modo: "assumir", chamado, novoStatus, erro: null });
            return;
        }

        const avisos = {
            [STATUS.ABERTO]: "O chamado volta para a fila geral, sem técnico responsável e sem prazo.",
            [STATUS.RESOLVIDO]: "O chamado será marcado como resolvido e sai da sua fila.",
            [STATUS.CANCELADO]: "O chamado será cancelado e sai da sua fila.",
        };

        Swal.fire({
            title: "Tem certeza?",
            html: `Mudar o chamado <b>#${chamado.id_chamado}</b> para <b>"${getStatusLabel(novoStatus)}"</b>?` +
                (avisos[novoStatus] ? `<br><small>${avisos[novoStatus]}</small>` : ""),
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "Sim, alterar!",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) salvarStatus(chamado, novoStatus);
        });
    };

    const abrirPrazo = (chamado) => {
        setPrazoDialog({ open: true, modo: chamado.dt_prazo ? "alterar" : "definir", chamado, novoStatus: null, erro: null });
    };

    const confirmarPrazo = ({ dt_prazo, ds_justificativa }) => {
        const { modo, chamado, novoStatus } = prazoDialog;
        if (!chamado) return;

        const fechar = () => setPrazoDialog((p) => ({ ...p, open: false }));
        const mostrarErro = (msg) => setPrazoDialog((p) => ({ ...p, erro: msg }));

        setPrazoProcessando(true);

        if (modo === "assumir") {
            salvarStatus(chamado, novoStatus, dt_prazo, {
                onSuccess: fechar,
                onError: mostrarErro,
                onFinish: () => setPrazoProcessando(false),
            });
            return;
        }

        router.post(`/chamados/${chamado.id_chamado}/prazo`, { dt_prazo, ds_justificativa }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`#${chamado.id_chamado}: prazo de entrega ${modo === "alterar" ? "alterado" : "definido"} para ${formatPrazo(dt_prazo)}.`);
                fechar();
            },
            onError: (errors) => mostrarErro(primeiroErro(errors) || "Não foi possível salvar o prazo."),
            onFinish: () => setPrazoProcessando(false),
        });
    };

    const botaoAtualizar = (
        <button
            type="button"
            onClick={atualizarFila}
            disabled={atualizando}
            title="Atualizar a fila"
            aria-label="Atualizar a fila"
            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-60"
        >
            <RefreshCw className={cn("w-4 h-4", atualizando && "animate-spin")} />
        </button>
    );

    const janelaPrazo = (
        <PrazoDialog
            open={prazoDialog.open}
            onOpenChange={(open) => setPrazoDialog((p) => ({ ...p, open, erro: null }))}
            modo={prazoDialog.modo}
            prazoAtual={prazoDialog.chamado?.dt_prazo}
            processing={prazoProcessando}
            erro={prazoDialog.erro}
            onConfirmar={confirmarPrazo}
            titulo={
                prazoDialog.chamado
                    ? prazoDialog.modo === "assumir"
                        ? `#${prazoDialog.chamado.id_chamado}: mudar para "${getStatusLabel(prazoDialog.novoStatus)}"`
                        : `#${prazoDialog.chamado.id_chamado}: ${prazoDialog.modo === "alterar" ? "alterar" : "definir"} prazo`
                    : undefined
            }
        />
    );

    if (!items || items.length === 0) {
        return (
            <Card className="shadow-sm bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm rounded-xl">
                 <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700/50 mb-2 shrink-0">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Minha Fila de Atendimento
                        </CardTitle>
                        {botaoAtualizar}
                    </div>
                </CardHeader>
                <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-center font-medium">Sua fila está vazia no momento.</p>
                        <p className="text-center text-sm mt-1">Ótimo trabalho! Todos os chamados foram atendidos.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col h-full">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 bg-slate-50/50 dark:bg-slate-800/20 relative">
                <div className="flex justify-between items-center gap-3">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Minha Fila de Atendimento
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Arraste os cards para definir sua prioridade. Clique no status ou no prazo para alterar.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {botaoAtualizar}
                        <div className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold leading-none flex items-center shadow-sm">
                            {items.length} chamado{items.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
                {/* Indicador de Salvamento (Loading border effect) */}
                {(isSaving || atualizando) && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 w-full loading-bar"></div>
                )}
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px] flex-1">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="fila-chamados">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`p-4 space-y-3 min-h-[100px] transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                }`}
                            >
                                {items.map((chamado, index) => {
                                    const status = Number(chamado.st_status);
                                    const alterando = alterandoId === chamado.id_chamado;
                                    const podeMexerNoPrazo = STATUS_COM_PRAZO.includes(status);

                                    return (
                                    <Draggable key={chamado.id_chamado.toString()} draggableId={chamado.id_chamado.toString()} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`
                                                    bg-white dark:bg-slate-800 border rounded-lg p-3 sm:p-4
                                                    flex items-center gap-3 sm:gap-4 transition-all duration-200
                                                    ${alterando ? 'opacity-60' : ''}
                                                    ${snapshot.isDragging
                                                        ? 'shadow-xl dark:shadow-indigo-900/20 border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-500/50 rotate-1 scale-[1.02] z-50'
                                                        : 'shadow-sm border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:shadow-md dark:hover:border-slate-600'}
                                                `}
                                                style={{...provided.draggableProps.style}}
                                            >
                                                {/* Alça de arrastar */}
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className={`cursor-grab active:cursor-grabbing p-1.5 -ml-2 rounded-md shrink-0 transition-colors
                                                        ${snapshot.isDragging ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300'}
                                                    `}
                                                    title="Arraste para reordenar"
                                                >
                                                    <GripVertical className="w-5 h-5" />
                                                </div>

                                                {/* Ordem Number Badge */}
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shadow-inner">
                                                    {index + 1}
                                                </div>

                                                {/* Conteúdo do Card */}
                                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={route('chamados.show', chamado.id_chamado)}
                                                            className="text-[15px] font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block mb-1"
                                                        >
                                                            #{chamado.id_chamado} - {chamado.ds_titulo}
                                                        </Link>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                            <span className="truncate font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {chamado.empresa?.ds_empresa || 'Empresa Indefinida'}</span>
                                                            <span className="hidden sm:inline">&bull;</span>
                                                            <span className="truncate hidden sm:inline">{chamado.solicitante?.ds_nome}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                                                        {/* Prazo: clique para definir/alterar */}
                                                        {podeMexerNoPrazo ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => abrirPrazo(chamado)}
                                                                disabled={alterando}
                                                                title={chamado.dt_prazo ? "Alterar prazo de entrega" : "Definir prazo de entrega"}
                                                                aria-label={`${chamado.dt_prazo ? "Alterar" : "Definir"} prazo de entrega: ${getPrazoTexto(chamado.dt_prazo, chamado.st_status)}`}
                                                                className="rounded-md transition hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                                            >
                                                                <PrazoBadge prazo={chamado.dt_prazo} status={chamado.st_status} />
                                                            </button>
                                                        ) : (
                                                            <PrazoBadge prazo={chamado.dt_prazo} status={chamado.st_status} />
                                                        )}

                                                        {/* Status: clique para mudar */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild disabled={alterando}>
                                                                <button
                                                                    type="button"
                                                                    title="Mudar status"
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-sm transition hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                                                                        getStatusBadgeClass(status)
                                                                    )}
                                                                >
                                                                    {alterando && <Loader2 className="w-3 h-3 animate-spin" />}
                                                                    {getStatusLabel(status)}
                                                                    <ChevronDown className="w-3 h-3 opacity-70" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-60 dark:bg-slate-900 dark:border-slate-700">
                                                                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-slate-400">Mudar status</DropdownMenuLabel>
                                                                {OPCOES_STATUS.map((s) => (
                                                                    <DropdownMenuItem
                                                                        key={s}
                                                                        disabled={s === status}
                                                                        onSelect={() => mudarStatus(chamado, s)}
                                                                        className="text-sm font-medium cursor-pointer gap-2"
                                                                    >
                                                                        <span className={cn("w-2 h-2 rounded-full shrink-0", getStatusDotClass(s))} />
                                                                        <span className="flex-1">{getStatusLabel(s)}</span>
                                                                        {s === status && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onSelect={() => mudarStatus(chamado, STATUS.ABERTO)}
                                                                    className="text-sm font-medium cursor-pointer gap-2 text-slate-600 dark:text-slate-300"
                                                                >
                                                                    <span className={cn("w-2 h-2 rounded-full shrink-0", getStatusDotClass(STATUS.ABERTO))} />
                                                                    Devolver para Aberto
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        <Link
                                                            href={route('chamados.show', chamado.id_chamado)}
                                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
                                                        >
                                                            Ver
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </CardContent>
            {janelaPrazo}
            {/* CSS inline para loading bar animation rápida */}
            <style jsx>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .loading-bar {
                    animation: loading 1s infinite linear;
                    transform-origin: 0% 50%;
                }
            `}</style>
        </Card>
    );
};

export default MinhaFila;
