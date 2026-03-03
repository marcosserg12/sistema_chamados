import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Link } from "@inertiajs/react";
import axios from "axios";
import { GripVertical, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MinhaFila = ({ chamadosFila }) => {
    const [items, setItems] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Atualiza o estado quando os props mudam
    useEffect(() => {
        setItems(chamadosFila || []);
    }, [chamadosFila]);

    const getStatusColor = (status) => {
        switch (status) {
            case 0:
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
            case 1:
                return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
            case 9:
                return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 0: return "Aberto";
            case 1: return "Em Andamento";
            case 9: return "Resolvido";
            default: return "Desconhecido";
        }
    };

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

    if (!items || items.length === 0) {
        return (
            <Card className="shadow-sm bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm rounded-xl">
                 <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-700/50 mb-2 shrink-0">
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Minha Fila de Atendimento
                    </CardTitle>
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
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            Minha Fila de Atendimento
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Arraste os cards para definir sua prioridade de atendimento
                        </p>
                    </div>
                    <div className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold leading-none flex items-center shadow-sm">
                        {items.length} chamado{items.length !== 1 ? 's' : ''}
                    </div>
                </div>
                {/* Indicador de Salvamento (Loading border effect) */}
                {isSaving && (
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
                                {items.map((chamado, index) => (
                                    <Draggable key={chamado.id_chamado.toString()} draggableId={chamado.id_chamado.toString()} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`
                                                    bg-white dark:bg-slate-800 border rounded-lg p-3 sm:p-4 
                                                    flex items-center gap-3 sm:gap-4 transition-all duration-200
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

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shadow-sm ${getStatusColor(chamado.st_status)}`}>
                                                            {getStatusLabel(chamado.st_status)}
                                                        </span>
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
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </CardContent>
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
