import React, { useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { 
    MessageSquare, 
    X, 
    Send, 
    Loader2, 
    Terminal, 
    Hash,
    AtSign,
    Paperclip,
    FileIcon,
    ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TechChat() {
    const { auth } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [file, setFile] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const scrollRef = useRef(null);
    const pollerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Permissão: Técnico (4), Admin (1) ou Super Admin (5)
    const canAccess = [1, 4, 5].includes(auth?.user?.id_perfil);

    if (!canAccess) return null;

    const fetchMessages = async () => {
        try {
            const response = await axios.get("/api/tech-chat");
            // Só atualiza se o número de mensagens mudou ou se é a primeira carga
            if (response.data.length !== messages.length || isLoading) {
                setMessages(response.data);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Erro ao carregar chat técnico:", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            pollerRef.current = setInterval(fetchMessages, 5000);
        } else {
            if (pollerRef.current) clearInterval(pollerRef.current);
        }
        return () => {
            if (pollerRef.current) clearInterval(pollerRef.current);
        };
    }, [isOpen, messages.length]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || isSending) return;

        setIsSending(true);
        const formData = new FormData();
        formData.append('mensagem', newMessage || "");
        if (file) formData.append('arquivo', file);

        try {
            const response = await axios.post("/api/tech-chat", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages([...messages, response.data.message]);
            setNewMessage("");
            setFile(null);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
        } finally {
            setIsSending(false);
        }
    };

    const isImage = (path) => path && /\.(jpg|jpeg|png|gif|webp)$/i.test(path);

    const renderMessageContent = (msg) => {
        const text = msg.ds_mensagem;
        const fileUrl = msg.ds_caminho_arquivo ? `/storage/${msg.ds_caminho_arquivo}` : null;

        let content = [];
        if (text) {
            const parts = text.split(/(\s+)/);
            content = parts.map((part, i) => {
                if (part.match(/^#\d+$/)) {
                    const id = part.substring(1);
                    return <Link key={i} href={`/chamados/${id}`} className="text-sky-400 font-black hover:underline cursor-pointer bg-sky-500/10 px-1 rounded">{part}</Link>;
                }
                if (part.startsWith('@') && part.length > 1) {
                    return <span key={i} className="text-amber-400 font-bold bg-amber-500/10 px-1 rounded">{part}</span>;
                }
                return part;
            });
        }

        return (
            <div className="space-y-3">
                {text && <div className="break-words">{content}</div>}
                {fileUrl && (
                    isImage(msg.ds_caminho_arquivo) ? (
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10 hover:opacity-80 transition-opacity">
                            <img src={fileUrl} alt="Anexo" className="max-w-full h-auto max-h-48 object-cover" />
                        </a>
                    ) : (
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg border border-white/5 hover:bg-slate-700 transition-colors group/file">
                            <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <FileIcon className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-bold truncate max-w-[150px] text-slate-300 group-hover/file:text-white">Ver Arquivo</span>
                            <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                        </a>
                    )
                )}
            </div>
        );
    };

    return (
        <>
            {/* Botão de Atalho */}
            <motion.button
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-32 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-2xl z-50 flex items-center justify-center border border-indigo-500/30 transition-all group"
                title="Canal de Operações"
            >
                <div className="relative flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white opacity-20 absolute" />
                    <Terminal className="w-5 h-5 text-white relative z-10" />
                </div>
                <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 dark:bg-indigo-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-white/10 whitespace-nowrap">
                    Canal Ops
                </div>
            </motion.button>

            {/* Painel Lateral */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-[#0f172a] text-slate-100 shadow-2xl z-[101] flex flex-col border-l border-white/10"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#1e293b]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                        <Terminal className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest">Canal de Operações</h2>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase">Equipe Técnica</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mensagens */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/50">
                                {isLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Sincronizando...</span>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const msgDate = format(new Date(msg.dt_envio), 'yyyy-MM-dd');
                                        const prevMsgDate = i > 0 ? format(new Date(messages[i-1].dt_envio), 'yyyy-MM-dd') : null;
                                        const showDateSeparator = msgDate !== prevMsgDate;

                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDateSeparator && (
                                                    <div className="flex items-center justify-center py-4 gap-3 opacity-30">
                                                        <div className="h-px bg-indigo-500/30 flex-1" />
                                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">
                                                            {format(new Date(msg.dt_envio), "dd/MM/yyyy", { locale: ptBR })}
                                                        </span>
                                                        <div className="h-px bg-indigo-500/30 flex-1" />
                                                    </div>
                                                )}
                                                <div className="flex gap-4 group animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <Avatar className="w-9 h-9 border border-white/10 shadow-lg shrink-0">
                                                        {msg.usuario?.ds_foto ? (
                                                            <img src={`/storage/${msg.usuario.ds_foto}`} alt="" className="object-cover" />
                                                        ) : (
                                                            <AvatarFallback className="bg-slate-800 text-xs font-black text-indigo-400">
                                                                {msg.usuario?.ds_nome?.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={cn("text-[11px] font-black uppercase tracking-wider", msg.id_usuario === auth.user.id_usuario ? "text-indigo-400" : "text-slate-300")}>
                                                                {msg.usuario?.ds_nome}
                                                            </span>
                                                            <span className="text-[9px] text-slate-500 font-bold">
                                                                {format(new Date(msg.dt_envio), "HH:mm", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                        <div className="text-[13px] text-slate-300 leading-relaxed font-medium">
                                                            {renderMessageContent(msg)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input com suporte a arquivos */}
                            <div className="p-5 bg-[#1e293b] border-t border-white/5">
                                <form onSubmit={handleSend} className="space-y-3">
                                    {file && (
                                        <div className="flex items-center gap-2 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-in zoom-in-95">
                                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                                <Paperclip className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase truncate flex-1 text-slate-300">{file.name}</span>
                                            <button type="button" onClick={() => setFile(null)} className="p-1 hover:text-rose-500"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                    <div className="relative flex items-center gap-2">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            onChange={(e) => setFile(e.target.files[0])} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current.click()} 
                                            className="w-10 h-10 shrink-0 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-all active:scale-95"
                                            title="Anexar arquivo"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <div className="relative flex-1">
                                            <input 
                                                type="text"
                                                placeholder="Mensagem para equipe..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 font-medium"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={(!newMessage.trim() && !file) || isSending} 
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30 p-1 active:scale-95"
                                            >
                                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                <div className="mt-3 flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-40">
                                    <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> #ID Chamado</div>
                                    <div className="flex items-center gap-1"><AtSign className="w-3 h-3" /> @Mencionar</div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
