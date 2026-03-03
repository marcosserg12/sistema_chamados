import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import { cn } from "@/lib/utils";
import {
    Ticket, Clock, AlertTriangle, MessageSquare, ArrowRight, User,
    CheckSquare, Plus, Trash2, Calendar, X, Send, AlignLeft, ListTodo
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";

const KanbanBoard = ({ initialColumns, auth }) => {
    const [columns, setColumns] = useState(initialColumns);

    // Modal State
    const [selectedChamadoId, setSelectedChamadoId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [chamadoData, setChamadoData] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [newChecklistItem, setNewChecklistItem] = useState("");

    // Obter iniciais
    const getInitials = (name) => {
        if (!name) return "MS";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    // Abrir Modal
    const openModal = async (id) => {
        setSelectedChamadoId(id);
        setIsModalOpen(true);
        setModalLoading(true);
        try {
            const response = await axios.get(`/api/kanban/chamado/${id}`);
            setChamadoData(response.data);
        } catch (error) {
            console.error("Erro ao carregar detalhes", error);
        } finally {
            // Delay suave para o load
            setTimeout(() => setModalLoading(false), 300);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setChamadoData(null);
        setSelectedChamadoId(null);
    };

    // Ações do Modal
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await axios.post(`/api/kanban/chamado/${selectedChamadoId}/comentario`, { ds_observacao: newComment });
            setNewComment("");
            // Recarregar os dados do modal
            const response = await axios.get(`/api/kanban/chamado/${selectedChamadoId}`);
            setChamadoData(response.data);
        } catch (error) {
            console.error("Erro ao adicionar nota interna", error);
        }
    };

    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim()) return;
        try {
            await axios.post(`/api/kanban/chamado/${selectedChamadoId}/checklist`, { ds_item: newChecklistItem });
            setNewChecklistItem("");
            const response = await axios.get(`/api/kanban/chamado/${selectedChamadoId}`);
            setChamadoData(response.data);
        } catch (error) {
            console.error("Erro ao adicionar item", error);
        }
    };

    const handleToggleChecklist = async (id) => {
        try {
            await axios.post(`/api/kanban/checklist/${id}/toggle`);
            setChamadoData(prev => ({
                ...prev,
                checklist: prev.checklist.map(item =>
                    item.id_checklist === id ? { ...item, st_concluido: !item.st_concluido } : item
                )
            }));
        } catch (error) {
            console.error("Erro ao alternar item", error);
        }
    };

    const handleDeleteChecklist = async (id) => {
        try {
            await axios.delete(`/api/kanban/checklist/${id}`);
            setChamadoData(prev => ({
                ...prev,
                checklist: prev.checklist.filter(item => item.id_checklist !== id)
            }));
        } catch (error) {
            console.error("Erro ao excluir item", error);
        }
    };

    const handleUpdatePrevisao = async (e) => {
        const date = e.target.value;
        try {
            await axios.post(`/api/kanban/chamado/${selectedChamadoId}/previsao`, { dt_previsao_termino: date });
            setChamadoData(prev => ({
                ...prev,
                chamado: { ...prev.chamado, dt_previsao_termino: date }
            }));
        } catch (error) {
            console.error("Erro ao atualizar previsão", error);
        }
    };

    useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

    return (
        <AppLayout>
            <Head title="Quadro Kanban" />
            <div className="w-full h-[calc(100vh-70px)] flex flex-col pb-2 px-4">
                <div className="flex-none mb-2 mt-1">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        Quadro de Chamados
                    </h1>
                </div>

                <div className="flex-1 w-full min-h-0 overflow-x-auto custom-scrollbar">
                    <div className="flex flex-row gap-3 lg:gap-4 h-full pb-1 min-w-max md:min-w-0">
                        {Object.values(columns).map((column) => (
                            <div key={column.id} className="flex flex-col flex-1 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-2 border border-slate-200/50 dark:border-slate-700/50 h-full max-h-full shadow-sm overflow-hidden min-w-[300px]">
                                <div className="flex-none mb-2">
                                    <div className={cn(
                                        "flex items-center justify-between p-2 rounded-lg border border-b-2",
                                        column.id === '0' && "bg-blue-50 border-blue-200 border-b-blue-500 dark:bg-blue-900/10 dark:border-blue-800/50 dark:border-b-blue-600",
                                        column.id === '1' && "bg-amber-50 border-amber-200 border-b-amber-500 dark:bg-amber-900/10 dark:border-amber-800/50 dark:border-b-amber-600",
                                        column.id === '9' && "bg-emerald-50 border-emerald-200 border-b-emerald-500 dark:bg-emerald-900/10 dark:border-emerald-800/50 dark:border-b-emerald-600"
                                    )}>
                                        <h3 className={cn(
                                            "font-black uppercase tracking-widest text-[11px]",
                                            column.id === '0' && "text-blue-700 dark:text-blue-400",
                                            column.id === '1' && "text-amber-700 dark:text-amber-400",
                                            column.id === '9' && "text-emerald-700 dark:text-emerald-400"
                                        )}>
                                            {column.title}
                                        </h3>
                                        <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-white/60 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                            {column.cards.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-1 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg custom-scrollbar relative min-h-0">
                                    {column.cards.map((card) => {
                                        return (
                                            <div
                                                key={card.id_chamado}
                                                onClick={() => openModal(card.id_chamado)}
                                                className={cn(
                                                    "mb-1.5 bg-white dark:bg-[#151c2c] p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm cursor-pointer select-none group transition-all",
                                                    (column.id === '1' && card.id_tecnico === auth.user.id_usuario) ? "ring-2 ring-indigo-500/50 border-indigo-400 dark:border-indigo-500 bg-indigo-50/10 dark:bg-indigo-500/10" : ""
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-slate-500">
                                                        <Ticket className="w-2.5 h-2.5" />
                                                        #{card.id_chamado}
                                                    </div>
                                                </div>
                                                <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1.5 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {card.ds_titulo}
                                                </h4>
                                                {card.ds_motivo && (
                                                    <div className="mb-2 inline-flex items-center border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded px-1 py-0.5 text-[8px] font-semibold text-slate-500 dark:text-slate-400 max-w-full">
                                                        <span className="truncate">{card.ds_motivo}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="flex -space-x-1">
                                                        <Tooltip content={card.ds_nome_solicitante}>
                                                            <Avatar className="w-4 h-4 border border-white dark:border-[#151c2c]">
                                                                {card.ds_foto_solicitante ? (
                                                                    <img src={`/storage/${card.ds_foto_solicitante}`} className="object-cover" />
                                                                ) : (
                                                                    <AvatarFallback className="text-[6px] bg-slate-200 text-slate-600 font-bold">{getInitials(card.ds_nome_solicitante)}</AvatarFallback>
                                                                )}
                                                            </Avatar>
                                                        </Tooltip>
                                                        {card.ds_nome_tecnico && (
                                                            <Tooltip content={`Técnico: ${card.ds_nome_tecnico}`}>
                                                                <Avatar className="w-4 h-4 border border-white dark:border-[#151c2c]">
                                                                    {card.ds_foto_tecnico ? (
                                                                        <img src={`/storage/${card.ds_foto_tecnico}`} className="object-cover" />
                                                                    ) : (
                                                                        <AvatarFallback className="text-[6px] bg-indigo-500 text-white font-bold">{getInitials(card.ds_nome_tecnico)}</AvatarFallback>
                                                                )}
                                                                </Avatar>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                                                        <Clock className="w-2 h-2" />
                                                        {formatDistanceToNow(new Date(card.dt_data_chamado), { addSuffix: true, locale: ptBR }).replace('aproximadamente ', '')}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes (Trello-style) */}
            <Modal
                show={isModalOpen}
                onClose={closeModal}
                maxWidth="7xl"
                maxHeight="full"
                className={modalLoading ? "bg-transparent shadow-none border-none" : "bg-white dark:bg-[#111827] shadow-2xl border border-slate-200 dark:border-slate-800"}
            >
                {modalLoading ? (
                    <div className="flex items-center justify-center p-20 bg-transparent min-h-[500px]">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : chamadoData ? (
                    <div className="flex flex-col md:flex-row overflow-hidden h-full min-h-[750px]">


                        {/* Lado Esquerdo: Conteúdo Principal */}
                        <div className="flex-1 p-5 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                                    <Ticket className="w-3.5 h-3.5" />
                                    <span className="text-[18px] font-black uppercase tracking-wider"><b>#{chamadoData.chamado.id_chamado}</b></span>
                                </div>
                                <h2 className="text-[18px] font-black tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                                    <b>{chamadoData.chamado.ds_titulo}</b>
                                </h2>
                                <p className="text-[18px] font-bold text-indigo-500 uppercase tracking-widest pt-1">
                                    <b>{columns[chamadoData.chamado.st_status]?.title}</b>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-[18px] uppercase tracking-widest opacity-60">
                                    <AlignLeft className="w-3 h-3" />
                                    <h3><b>Descrição</b></h3>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 text-[18px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                    <b>{chamadoData.chamado.ds_descricao || "Sem descrição informada."}</b>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-[18px] uppercase tracking-widest opacity-60">
                                        <ListTodo className="w-6 h-6" />
                                        <h3><b>Checklist</b></h3>
                                    </div>
                                    <span className="text-[18px] font-black text-slate-400">
                                        <b>{chamadoData.checklist.filter(i => i.st_concluido).length}/{chamadoData.checklist.length}</b>
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                        style={{ width: `${chamadoData.checklist.length > 0 ? (chamadoData.checklist.filter(i => i.st_concluido).length / chamadoData.checklist.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <div className="space-y-1 mt-4">
                                    {chamadoData.checklist.map((item) => (
                                        <div key={item.id_checklist} className="group flex items-center gap-3 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg transition-all">
                                            <button
                                                onClick={() => handleToggleChecklist(item.id_checklist)}
                                                className={cn(
                                                    "w-6 h-6 rounded border flex items-center justify-center transition-all flex-none",
                                                    item.st_concluido ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                                )}
                                            >
                                                {item.st_concluido && <CheckSquare className="w-4 h-4" />}
                                            </button>
                                            <span className={cn(
                                                "text-[18px] flex-1 transition-all",
                                                item.st_concluido ? "text-slate-400 line-through opacity-60" : "text-slate-700 dark:text-slate-300"
                                            )}>
                                                <b>{item.ds_item}</b>
                                            </span>
                                            <button
                                                onClick={() => handleDeleteChecklist(item.id_checklist)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="pt-3 flex gap-2">
                                        <input
                                            className="flex-1 text-[18px] font-bold h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-500 shadow-sm"
                                            placeholder="Novo item..."
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                        />
                                        <button
                                            onClick={handleAddChecklistItem}
                                            className="h-14 w-14 flex items-center justify-center bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                                        >
                                            <Plus className="w-6 h-14" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-[18px] uppercase tracking-widest opacity-60">
                                    <MessageSquare className="w-6 h-6" />
                                    <h3><b>Notas Board</b></h3>
                                </div>
                                <div className="space-y-3">
                                    <textarea
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-[18px] font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none min-h-[80px] text-slate-800 dark:text-slate-200 placeholder:text-slate-500 shadow-sm"
                                        placeholder="Nota interna rápida..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    ></textarea>
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="text-[15px] font-black uppercase tracking-[0.1em] py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-all shadow-lg active:scale-95"
                                    >
                                        <b>Gravar Nota</b>
                                    </button>
                                </div>
                                <div className="space-y-4 mt-6">
                                    {chamadoData.comentarios.map((c) => (
                                        <div key={c.id_observacao} className="flex flex-col bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[18px] font-black text-slate-700 dark:text-slate-200 uppercase"><b>{c.usuario?.ds_nome}</b></span>
                                                <span className="text-[14px] font-bold text-slate-400"><b>{formatDistanceToNow(new Date(c.dt_criacao), { addSuffix: true, locale: ptBR })}</b></span>
                                            </div>
                                            <div className="text-[18px] leading-relaxed text-slate-600 dark:text-slate-400">
                                                <b>{c.ds_observacao}</b>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[250px] bg-slate-50/50 dark:bg-[#0c1222]/50 p-5 space-y-6 flex flex-col border-l border-slate-100 dark:border-slate-800">
                            <div className="space-y-5">
                                <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-400"><b>Gestão</b></h4>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[14px] font-black text-slate-500 uppercase">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <b>Prazo</b>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[14px] font-black text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm transition-all"
                                        value={chamadoData.chamado.dt_previsao_termino ? format(new Date(chamadoData.chamado.dt_previsao_termino), "yyyy-MM-dd'T'HH:mm") : ""}
                                        onChange={handleUpdatePrevisao}
                                    />
                                </div>
                                <Link
                                    href={`/chamados/${chamadoData.chamado.id_chamado}`}
                                    className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-[14px] font-black text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group active:scale-95"
                                >
                                    <b>Ver Chamado</b>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                            <div className="space-y-5 pt-5 mt-auto border-t border-slate-200 dark:border-slate-800">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="w-10 h-10 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                                            {chamadoData.chamado.solicitante?.ds_foto ? (
                                                <img src={`/storage/${chamadoData.chamado.solicitante.ds_foto}`} className="object-cover" />
                                            ) : (
                                                <AvatarFallback className="text-[12px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-black">{getInitials(chamadoData.chamado.solicitante?.ds_nome)}</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] text-slate-400 font-black uppercase"><b>Dono</b></span>
                                            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 truncate"><b>{chamadoData.chamado.solicitante?.ds_nome}</b></span>
                                        </div>
                                    </div>
                                    {chamadoData.chamado.tecnico && (
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="w-10 h-10 shadow-sm ring-1 ring-indigo-500/20">
                                                {chamadoData.chamado.tecnico.ds_foto ? (
                                                    <img src={`/storage/${chamadoData.chamado.tecnico.ds_foto}`} className="object-cover" />
                                                ) : (
                                                    <AvatarFallback className="text-[12px] bg-indigo-600 text-white font-black">{getInitials(chamadoData.chamado.tecnico.ds_nome)}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] text-indigo-500 font-black uppercase"><b>Técnico</b></span>
                                                <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 truncate"><b>{chamadoData.chamado.tecnico.ds_nome}</b></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-xl transition-all active:scale-90 md:hidden"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : null}
            </Modal>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(71, 85, 105, 0.5);
                }
            `}} />
        </AppLayout>
    );
};

const Tooltip = ({ children, content }) => {
    return (
        <div className="group/tooltip relative flex items-center justify-center">
            {children}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {content}
            </div>
        </div>
    );
};

export default KanbanBoard;
