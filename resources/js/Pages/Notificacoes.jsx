import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { 
    Bell, 
    CheckCircle2, 
    Trash2, 
    Clock, 
    MessageSquare, 
    Ticket, 
    UserPlus, 
    Edit3,
    ArrowRight,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Notificacoes({ notifications }) {
    
    const markAllRead = () => {
        router.post(route('notifications.markAllRead'), {}, {
            preserveScroll: true
        });
    };

    const deleteNotification = (id) => {
        router.delete(route('notifications.destroy', id), {
            preserveScroll: true
        });
    };

    const markAsRead = (id) => {
        router.post(`/api/notifications/${id}/read`, {}, {
            onSuccess: () => router.reload({ preserveScroll: true })
        });
    };

    const getIcon = (type) => {
        if (type.includes('ChamadoCriado')) return <Ticket className="w-5 h-5 text-blue-500" />;
        if (type.includes('NovoComentario')) return <MessageSquare className="w-5 h-5 text-indigo-500" />;
        if (type.includes('ChamadoAtribuido')) return <UserPlus className="w-5 h-5 text-amber-500" />;
        if (type.includes('StatusAlterado')) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        return <Bell className="w-5 h-5 text-slate-400" />;
    };

    return (
        <AppLayout>
            <Head title="Minhas Notificações" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Bell className="w-6 h-6 text-indigo-600" />
                            Notificações
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Fique por dentro das atualizações dos seus chamados.</p>
                    </div>
                    {notifications.data.length > 0 && (
                        <Button 
                            variant="outline" 
                            onClick={markAllRead}
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-wider"
                        >
                            Marcar tudo como lido
                        </Button>
                    )}
                </div>

                <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        {notifications.data.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                    <Bell className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">Você não tem nenhuma notificação no momento.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {notifications.data.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={cn(
                                            "p-5 flex items-start gap-4 transition-colors relative group",
                                            !n.read_at ? "bg-indigo-50/30 dark:bg-indigo-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        )}
                                    >
                                        {!n.read_at && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                                        )}
                                        
                                        <div className="mt-1 shrink-0 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            {getIcon(n.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <h3 className={cn(
                                                    "text-sm font-bold truncate",
                                                    !n.read_at ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                                                )}>
                                                    {n.data.title || "Atualização no Chamado"}
                                                </h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                                {n.data.message}
                                            </p>
                                            
                                            <div className="mt-4 flex items-center gap-3">
                                                {n.data.url && (
                                                    <Link 
                                                        href={n.data.url} 
                                                        onClick={() => !n.read_at && markAsRead(n.id)}
                                                        className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                                                    >
                                                        Ver Detalhes <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                )}
                                                {!n.read_at && (
                                                    <button 
                                                        onClick={() => markAsRead(n.id)}
                                                        className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                    >
                                                        Marcar como lida
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => deleteNotification(n.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="Excluir notificação"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PAGINAÇÃO */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {notifications.links.map((link, index) => {
                            const isPrevious = index === 0;
                            const isNext = index === notifications.links.length - 1;

                            if (isPrevious) {
                                return (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={cn(
                                            "flex flex-row items-center gap-1.5 px-4 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider shadow-sm",
                                            !link.url && "opacity-40 pointer-events-none grayscale"
                                        )}
                                    >
                                        <ChevronLeft className="w-4 h-4 shrink-0" />
                                        Anterior
                                    </Link>
                                );
                            }

                            if (isNext) {
                                return (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={cn(
                                            "flex flex-row items-center gap-1.5 px-4 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider shadow-sm",
                                            !link.url && "opacity-40 pointer-events-none grayscale"
                                        )}
                                    >
                                        Próximo
                                        <ChevronRight className="w-4 h-4 shrink-0" />
                                    </Link>
                                );
                            }

                            // Filtra apenas alguns números para não poluir
                            const label = parseInt(link.label);
                            if (isNaN(label)) return null;
                            
                            const isCurrent = link.active;
                            const isNear = Math.abs(label - notifications.current_page) <= 1;
                            const isEnd = label === 1 || label === notifications.last_page;

                            if (!isNear && !isEnd) {
                                if (label === 2 || label === notifications.last_page - 1) return <span key={index} className="text-slate-400">...</span>;
                                return null;
                            }

                            return (
                                <Link
                                    key={index}
                                    href={link.url || "#"}
                                    className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all font-bold text-xs shadow-sm",
                                        isCurrent
                                            ? "bg-indigo-600 text-white shadow-indigo-500/30"
                                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
