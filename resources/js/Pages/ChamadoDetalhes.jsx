import React, { useState } from "react";
import { Link, usePage, router, Head, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/Components/ui/dialog";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  User,
  FileText,
  MessageSquare,
  Send,
  Paperclip,
  Package,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Tag,
  Info,
  ListTree,
  Activity,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Edit3,
  UploadCloud,
  X,
  Lock,
  Check,
  CheckCheck,
  File as FileIcon
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Swal from "sweetalert2";
import axios from "axios";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ChamadoDetalhes({ chamado, historico = [], chat = [], tecnicos = [], empresas = [], tiposChamado = [] }) {
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- LÓGICA DE CHAT EM TEMPO REAL (Polling) ---
  const [currentChat, setCurrentChat] = useState(chat);
  const chatEndRef = React.useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  // Função para marcar chat como lido
  const markChatAsRead = async () => {
    try {
      await axios.post(`/api/chamados/${chamado.id_chamado}/chat/read`);
      // Atualiza o estado local IMEDIATAMENTE para o "!" sumir na hora
      setCurrentChat(prev => prev.map(m => 
        m.id_usuario !== auth.user.id_usuario 
          ? { ...m, dt_leitura: m.dt_leitura || new Date().toISOString() } 
          : m
      ));
    } catch (error) {
      console.error("Erro ao marcar chat como lido:", error);
    }
  };

  // Efeito para polling do chat
  React.useEffect(() => {
    let interval;
    if (isChatOpen) {
      // Marca como lido ao abrir
      markChatAsRead();

      // Busca novas mensagens a cada 5 segundos se o chat estiver aberto
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/chamados/${chamado.id_chamado}/chat`);
          
          // Verifica se há novas mensagens do OUTRO usuário para marcar como lido
          const hasNewFromOther = response.data.some(m => 
            m.id_usuario !== auth.user.id_usuario && !m.dt_leitura
          );

          if (hasNewFromOther) {
            markChatAsRead();
          }

          // Só atualiza se houver qualquer mudança (mensagem nova ou status de leitura novo)
          const currentIds = currentChat.map(m => `${m.id}-${m.dt_leitura}`).join(',');
          const newIds = response.data.map(m => `${m.id}-${m.dt_leitura}`).join(',');

          if (currentIds !== newIds) {
            setCurrentChat(response.data);
          }
        } catch (error) {
          console.error("Erro ao atualizar chat:", error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isChatOpen, currentChat.length, chamado.id_chamado]);

  // Scroll automático ao abrir o chat ou receber nova mensagem
  React.useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [currentChat, isChatOpen]);

  // Form do Chat
  const { data: chatData, setData: setChatData, post: postChat, processing: chatProcessing, reset: resetChat } = useForm({
    mensagem: "",
    arquivo: null,
  });

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatData.mensagem && !chatData.arquivo) return;

    postChat(route('chamados.chat', chamado.id_chamado), {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
            resetChat();
            markChatAsRead();
            // Busca as mensagens imediatamente após o envio para o usuário ver na hora
            axios.get(`/api/chamados/${chamado.id_chamado}/chat`).then(res => {
              setCurrentChat(res.data);
              scrollToBottom("auto");
            });
        }
    });
  };

  // Form de Edição Expandido
  const { data: editData, setData: setEditData, post: postEdit, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
    ds_titulo: chamado.ds_titulo || "",
    id_empresa: chamado.id_empresa ? String(chamado.id_empresa) : "",
    id_localizacao: chamado.id_localizacao ? String(chamado.id_localizacao) : "",
    id_tipo_chamado: chamado.id_tipo_chamado ? String(chamado.id_tipo_chamado) : "",
    id_motivo_principal: chamado.id_motivo_principal ? String(chamado.id_motivo_principal) : "",
    id_motivo_associado: chamado.id_motivo_associado ? String(chamado.id_motivo_associado) : "",
    st_grau: chamado.st_grau ? String(chamado.st_grau) : "",
    ds_patrimonio: chamado.ds_patrimonio || "",
    ds_descricao: chamado.ds_descricao || "",
    arquivos: [], // Novos arquivos
    arquivos_excluidos: [], // IDs dos arquivos para deletar
  });

  const [localizacoes, setLocalizacoes] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [detalhes, setDetalhes] = useState([]);
  const [loadingSelects, setLoadingSelects] = useState({});

  // Efeito para carregar localizações ao abrir modal ou mudar empresa
  React.useEffect(() => {
    if (isEditModalOpen && editData.id_empresa) {
      setLoadingSelects(p => ({ ...p, localizacao: true }));
      axios.get(`/api/localizacoes?id_empresa=${editData.id_empresa}`)
        .then(res => setLocalizacoes(res.data))
        .finally(() => setLoadingSelects(p => ({ ...p, localizacao: false })));
    }
  }, [editData.id_empresa, isEditModalOpen]);

  // Efeito para carregar motivos
  React.useEffect(() => {
    if (isEditModalOpen && editData.id_tipo_chamado) {
      setLoadingSelects(p => ({ ...p, motivo: true }));
      axios.get(`/api/motivos?id_tipo_chamado=${editData.id_tipo_chamado}`)
        .then(res => setMotivos(res.data))
        .finally(() => setLoadingSelects(p => ({ ...p, motivo: false })));
    }
  }, [editData.id_tipo_chamado, isEditModalOpen]);

  // Efeito para carregar detalhamentos
  React.useEffect(() => {
    if (isEditModalOpen && editData.id_motivo_principal) {
      setLoadingSelects(p => ({ ...p, detalhe: true }));
      const url = editData.id_motivo_principal === "6"
        ? `/api/detalhes-motivo?id_motivo=${editData.id_motivo_principal}&id_empresa=${editData.id_empresa}`
        : `/api/detalhes-motivo?id_motivo=${editData.id_motivo_principal}`;

      axios.get(url)
        .then(res => setDetalhes(res.data))
        .finally(() => setLoadingSelects(p => ({ ...p, detalhe: false })));
    }
  }, [editData.id_motivo_principal, editData.id_empresa, isEditModalOpen]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setEditData("arquivos", [...editData.arquivos, ...files]);
    e.target.value = null;
  };

  const removeNewFile = (index) => {
    const newFiles = [...editData.arquivos];
    newFiles.splice(index, 1);
    setEditData("arquivos", newFiles);
  };

  const toggleExcludeExistingFile = (id) => {
    const current = [...editData.arquivos_excluidos];
    if (current.includes(id)) {
      setEditData("arquivos_excluidos", current.filter(i => i !== id));
    } else {
      setEditData("arquivos_excluidos", [...current, id]);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    // Usamos post com _method: 'put' para suportar upload de arquivos no Laravel via multipart/form-data
    postEdit(route('chamados.update', chamado.id_chamado), {
      forceFormData: true,
      _method: 'put',
      onSuccess: () => {
        setIsEditModalOpen(false);
        toast.success("Chamado editado com sucesso!");
      },
      onError: () => toast.error("Verifique os campos obrigatórios.")
    });
  };

  // Lógica do CTRL+V (Colar Imagens) no Modal
  React.useEffect(() => {
    const handlePaste = (e) => {
      if (!isEditModalOpen) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const newFile = new File([blob], `imagem_colada_${Date.now()}_${i}.png`, { type: blob.type });
            pastedFiles.push(newFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        setEditData("arquivos", [...editData.arquivos, ...pastedFiles]);
        toast.success(`${pastedFiles.length} imagem(ns) colada(s) com sucesso!`);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [editData.arquivos, isEditModalOpen]);

  // Controle de Permissões
  const { auth } = usePage().props;
  const isSuperAdmin = auth.user.id_perfil === 5;
  const isAdmin = auth.user.id_perfil === 1;
  const isAnyAdmin = isSuperAdmin || isAdmin;
  const isTecnico = auth.user.id_perfil === 4;
  
  // Painel de Gestão: Acesso para Admins ou qualquer Técnico
  const canManage = isAnyAdmin || isTecnico;
  
  // Solicitante ou Técnico Responsável
  const isSolicitante = String(auth.user.id_usuario) === String(chamado.id_usuario);
  const isResponsavel = chamado.id_tecnico && String(auth.user.id_usuario) === String(chamado.id_tecnico);
  
  // canEdit: Apenas Solicitante ou Responsável (Regra estrita)
  const canEdit = isSolicitante || isResponsavel;

  // canChat: Apenas Solicitante ou Responsável (Admins removidos conforme solicitado)
  const canChat = isSolicitante || isResponsavel;

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // =========================================================================
  // RENDERIZADORES DE LAYOUT
  // =========================================================================

  const renderStatus = (statusId) => {
    const statusMap = {
      0: { label: 'Aberto', classes: 'bg-blue-500 text-white shadow-blue-500/20' },
      1: { label: 'Em Andamento', classes: 'bg-amber-500 text-white shadow-amber-500/20' },
      9: { label: 'Resolvido', classes: 'bg-emerald-500 text-white shadow-emerald-500/20' },
    };
    const config = statusMap[statusId] || { label: `Status ${statusId}`, classes: 'bg-slate-500 text-white shadow-slate-500/20' };

    return (
      <span className={cn("px-4 py-1.5 rounded-full text-sm font-bold shadow-lg tracking-wide shrink-0", config.classes)}>
        {config.label}
      </span>
    );
  };

  // Motor Inteligente de Ícones para o Histórico
  const getLogConfig = (text) => {
    if (!text) return { type: 'comentario', icon: null };

    // Se for Status alterado
    if (text.includes("Status alterado")) {
      return { type: 'status', icon: RefreshCw, color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-500/10 border-sky-200 dark:border-sky-900' };
    }

    // Se for atribuição de técnico ou técnico removido
    if (text.includes("atribuído") || text.includes("removido")) {
      return { type: 'atribuicao', icon: UserPlus, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-900' };
    }

    // Se o chamado foi editado
    if (text.includes("Editado")) {
      return { type: 'edicao', icon: Edit3, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900' };
    }

    // Se for uma mensagem escrita pelo usuário (Comentário)
    return { type: 'comentario', icon: null };
  };

  const getSlaStatus = () => {
    if (!chamado?.dt_prazo_sla) return null;
    if (Number(chamado.st_status) === 9) return "ok";

    const prazo = new Date(chamado.dt_prazo_sla);
    const now = new Date();

    if (isPast(prazo)) return "atrasado";
    const diffHours = (prazo - now) / (1000 * 60 * 60);
    if (diffHours <= 4) return "urgente";
    return "ok";
  };
  const slaStatus = getSlaStatus();

  const getGrauLabel = (grau) => {
    if (String(grau) === '1') return "Melhoria";
    if (String(grau) === '2') return "Problema";
    if (String(grau) === '3') return "Cadastro de Paciente";
    if (String(grau) === '4') return "Relatório";
    return "-";
  };

  const isImage = (filename) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  const isChatImage = (path) => path && /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
  const anexosImagens = chamado.anexos?.filter(a => isImage(a.name)) || [];
  const anexosDocumentos = chamado.anexos?.filter(a => !isImage(a.name)) || [];

  // =========================================================================
  // AÇÕES DO SISTEMA
  // =========================================================================

  const handleUpdate = (data) => {
    setLoading(true);
    router.put(`/chamados/${chamado.id_chamado}`, data, {
      onSuccess: () => {
        toast.success("Chamado atualizado com sucesso!");
        setLoading(false);
      },
      onError: () => {
        toast.error("Erro ao atualizar chamado.");
        setLoading(false);
      }
    });
  };

  const confirmStatusChange = (statusValue, statusName) => {
    Swal.fire({
      title: "Tem certeza?",
      text: `Deseja mudar o status deste chamado para "${statusName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, alterar!",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        handleUpdate({ st_status: statusValue });
      }
    });
  };

  const handleAddComentario = () => {
    if (!comentario.trim()) return;
    setLoading(true);
    router.post(`/chamados/${chamado.id_chamado}/historico`, {
      descricao: comentario
    }, {
      onSuccess: () => {
        setComentario("");
        toast.success("Interação registrada com sucesso!");
        setLoading(false);
      }
    });
  };

  return (
    <AppLayout>
      <Head title={`Chamado #${chamado.id_chamado}`} />

      <div className="max-w-7xl mx-auto space-y-6 pb-12">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            <Link href="/chamados" className="inline-flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para lista
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {chamado.ds_titulo}
                <span className="text-slate-400 dark:text-slate-500 font-bold ml-2">#{chamado.id_chamado}</span>
              </h1>
              <div className="flex items-center gap-3">
                {renderStatus(chamado.st_status)}
                {canEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditModalOpen(true)}
                    className="h-8 gap-1.5 font-bold text-xs uppercase tracking-wider border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {slaStatus && slaStatus !== "ok" && (
            <div className={cn(
              "flex items-center gap-3 px-5 py-4 rounded-xl border-l-4 shadow-sm shrink-0 h-fit",
              slaStatus === "atrasado"
                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-500"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-500"
            )}>
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-extrabold uppercase tracking-wider">
                  {slaStatus === "atrasado" ? "SLA Ultrapassado" : "Atenção ao SLA"}
                </span>
                <span className="text-xs font-medium opacity-80">Prioridade de atendimento</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ================= COLUNA DE GESTÃO (FIXA NO TOPO NO MOBILE) ================= */}
          <div className="lg:col-span-1 lg:order-last">
            {canManage && (
              <div className="sticky top-[64px] lg:top-24 z-20 pt-1 lg:pt-0 pb-4">
                <Card className="shadow-xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden">
                  <CardHeader className="bg-slate-900 dark:bg-slate-950 text-white border-b border-white/5 py-3 lg:py-5">
                    <CardTitle className="text-xs lg:text-base font-black tracking-wider flex items-center gap-2 uppercase">
                      <Activity className="w-4 h-4 lg:w-5 h-5 text-indigo-400 animate-pulse" />
                      Gestão do Chamado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 lg:space-y-6 pt-4 lg:pt-6 bg-white dark:bg-slate-900/40">

                    {/* BOTÕES DE AÇÃO RÁPIDA DE STATUS */}
                    <div>
                      <label className="hidden lg:flex text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-4 items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-indigo-500" /> Atualizar Status
                      </label>
                      <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmStatusChange(0, 'Aberto')}
                          disabled={loading || String(chamado.st_status) === '0'}
                          className={cn("h-10 lg:h-12 font-bold transition-all justify-center lg:justify-start border-2 text-[10px] lg:text-sm px-1 lg:px-4",
                            String(chamado.st_status) === '0'
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                              : "bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800"
                          )}
                        >
                          <div className={cn("hidden lg:block w-2.5 h-2.5 rounded-full mr-3 ring-4 ring-offset-0", 
                            String(chamado.st_status) === '0' ? "bg-white ring-white/20" : "bg-blue-500 ring-blue-500/20"
                          )} />
                          Aberto
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmStatusChange(1, 'Em Andamento')}
                          disabled={loading || String(chamado.st_status) === '1'}
                          className={cn("h-10 lg:h-12 font-bold transition-all justify-center lg:justify-start border-2 text-[10px] lg:text-sm px-1 lg:px-4",
                            String(chamado.st_status) === '1'
                              ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                              : "bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800"
                          )}
                        >
                          <div className={cn("hidden lg:block w-2.5 h-2.5 rounded-full mr-3 ring-4 ring-offset-0", 
                            String(chamado.st_status) === '1' ? "bg-white ring-white/20" : "bg-amber-500 ring-amber-500/20"
                          )} />
                          Andamento
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmStatusChange(9, 'Resolvido')}
                          disabled={loading || String(chamado.st_status) === '9'}
                          className={cn("h-10 lg:h-12 font-bold transition-all justify-center lg:justify-start border-2 text-[10px] lg:text-sm px-1 lg:px-4",
                            String(chamado.st_status) === '9'
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                              : "bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800"
                          )}
                        >
                          <div className={cn("hidden lg:block w-2.5 h-2.5 rounded-full mr-3 ring-4 ring-offset-0", 
                            String(chamado.st_status) === '9' ? "bg-white ring-white/20" : "bg-emerald-500 ring-emerald-500/20"
                          )} />
                          Resolvido
                        </Button>
                      </div>
                    </div>

                    {/* Alterar Técnico (Mais compacto no mobile) */}
                    <div className="space-y-2 lg:space-y-3 pb-2 lg:pb-0">
                      <label className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-amber-500" /> Responsável
                      </label>
                      <Select
                        value={chamado.id_tecnico ? String(chamado.id_tecnico) : undefined}
                        onValueChange={(v) => handleUpdate({ id_tecnico: v })}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800/80 h-10 lg:h-14 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 rounded-xl lg:rounded-2xl border-2 px-3 lg:px-4 text-xs lg:text-sm">
                          <SelectValue placeholder="Sem técnico" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                          {tecnicos.map((t) => (
                            <SelectItem key={t.id_usuario} value={String(t.id_usuario)} className="font-semibold py-2 lg:py-3">
                              <span className="text-xs lg:text-sm">{t.ds_nome}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* CARD: INFORMAÇÕES SECUNDÁRIAS (Abaixo da gestão no mobile, na lateral no desktop) */}
            <div className="mt-6">
              <InfoCard chamado={chamado} getInitials={getInitials} />
            </div>
          </div>

          {/* ================= COLUNA PRINCIPAL ================= */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <CardContent className="pt-6 sm:pt-8 space-y-10">

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl p-4 border-l-4 border-l-indigo-500">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-indigo-500" />
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Tipo</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{chamado.ds_tipo_chamado || "-"}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl p-4 border-l-4 border-l-sky-500">
                        <div className="flex items-center gap-2 mb-1">
                          <ListTree className="w-4 h-4 text-sky-500" />
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Motivo</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{chamado.ds_motivo || "-"}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl p-4 border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-2 mb-1">
                          <Info className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Detalhe</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{chamado.ds_detalhamento || "-"}</span>
                    </div>

                    {(['1', '2', '3', '4'].includes(String(chamado.st_grau))) && String(chamado.id_motivo_principal) === '6' && String(chamado.id_tipo_chamado) === '2' && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl p-4 border-l-4 border-l-rose-500">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Solicitação</span>
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{getGrauLabel(chamado.st_grau)}</span>
                      </div>
                    )}

                    {String(chamado.id_tipo_chamado) === '1' && chamado.ds_patrimonio && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-xl p-4 border-l-4 border-l-amber-500 md:col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Patrimônio</span>
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{chamado.ds_patrimonio}</span>
                      </div>
                    )}
                </div>

                <div className="flex flex-col">
                  <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                    Descrição da Solicitação
                  </h4>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>

                    <div className="bg-slate-50 dark:bg-[#151c2c] p-6 sm:p-8 pl-8 sm:pl-10">
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-[15px] sm:text-[16px] leading-loose font-medium">
                        {chamado.ds_descricao || "Sem descrição detalhada."}
                      </p>
                    </div>
                  </div>
                </div>

                {(anexosImagens.length > 0 || anexosDocumentos.length > 0) && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" /> Arquivos Anexados
                    </h4>

                    {anexosImagens.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {anexosImagens.map((anexo, i) => (
                          <a key={i} href={anexo.path} target="_blank" rel="noreferrer" className="group block relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800 transition-all hover:border-indigo-500 dark:hover:border-indigo-400">
                            <img src={anexo.path} alt={anexo.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {anexosDocumentos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {anexosDocumentos.map((anexo, i) => (
                          <a key={i} href={anexo.path} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                              <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">{anexo.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CARD: TIMELINE DE HISTÓRICO */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                  <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  Histórico de Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="space-y-6">
                  {historico.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-8 font-medium">Nenhuma movimentação registrada.</p>}

                  {historico.map((item, index) => {
                    const logInfo = getLogConfig(item.ds_historico || item.ds_comentario);
                    const isSystemLog = logInfo.type !== 'comentario';
                    const IconComponent = logInfo.icon;

                    return (
                      <div key={index} className="flex gap-5">
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-2 border-white dark:border-slate-900 z-10 shadow-md">
                              {item.ds_foto_usuario ? (
                                <img src={`/storage/${item.ds_foto_usuario}`} className="aspect-square h-full w-full object-cover rounded-full" />
                              ) : (
                                <AvatarFallback className="bg-indigo-600 text-white text-sm font-bold">
                                  {getInitials(item.ds_nome_usuario)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            {/* Ícone de Ação (Badge no Canto da Foto) - Aumentado */}
                            {isSystemLog && (
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center z-20 shadow-sm",
                                logInfo.bg
                              )}>
                                <IconComponent className={cn("w-4 h-4", logInfo.color)} />
                              </div>
                            )}
                          </div>

                          {index < historico.length - 1 && (
                            <div className="flex-1 w-0.5 bg-slate-200 dark:bg-slate-800 mt-2" />
                          )}
                        </div>

                        <div className="flex-1 pb-8 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {item.ds_nome_usuario}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                              {formatDistanceToNow(new Date(item.dt_insert), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>

                          <div className={cn(
                            "text-sm mt-2 p-4 rounded-xl border shadow-sm leading-relaxed",
                            isSystemLog
                              ? "bg-slate-50 dark:bg-[#151c2c] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50 font-medium"
                              : "bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-900 dark:text-indigo-200 border-indigo-100 dark:border-indigo-800/50 font-normal"
                          )}>
                            {item.ds_historico || item.ds_comentario}
                          </div>

                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-2 ml-1">
                             {format(new Date(item.dt_insert), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900">
              <CardContent className="p-6">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-4">
                  <Info className="w-4 h-4" /> Adicionar observação
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 -mt-2 font-medium italic">
                  * Observações são públicas e visíveis para todos os envolvidos no chamado.
                </p>
                <Textarea
                  placeholder="Escreva uma observação importante ou informação pública sobre o chamado..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className="bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 shadow-inner focus:border-indigo-400 focus:ring-indigo-400 resize-none rounded-xl text-slate-800 dark:text-slate-200"
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleAddComentario}
                    disabled={!comentario.trim() || loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold min-w-[140px] rounded-xl shadow-md transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Registrar Observação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* MODAL DE EDIÇÃO COMPLETA */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
            <DialogHeader className="p-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-black flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-500" />
                    Editar Chamado #{chamado.id_chamado}
                  </DialogTitle>
                  <DialogDescription className="dark:text-slate-400 mt-1">
                    Ajuste todas as informações da solicitação abaixo.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 custom-scrollbar">
              <form id="edit-ticket-form" onSubmit={handleEditSubmit} noValidate className="space-y-10 pb-10">
                
                {/* 1. TÍTULO */}
                <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                  <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2 block uppercase tracking-wider">
                    Título Resumido <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={editData.ds_titulo}
                    onChange={e => setEditData("ds_titulo", e.target.value)}
                    className={cn(
                      "h-12 text-base font-semibold shadow-sm transition-colors bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                      editErrors.ds_titulo && "border-rose-500 bg-rose-50/50 dark:bg-rose-500/10"
                    )}
                  />
                  {editErrors.ds_titulo && <p className="text-rose-500 text-xs font-bold mt-2">{editErrors.ds_titulo}</p>}
                </div>

                {/* 2. EMPRESA E LOCALIZAÇÃO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Empresa <span className="text-rose-500">*</span></label>
                    <Select value={String(editData.id_empresa)} onValueChange={v => setEditData("id_empresa", v)}>
                      <SelectTrigger className="h-12 font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                        {empresas.map(e => <SelectItem key={e.id_empresa} value={String(e.id_empresa)}>{e.ds_empresa}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Localização <span className="text-rose-500">*</span></label>
                    <Select value={String(editData.id_localizacao)} onValueChange={v => setEditData("id_localizacao", v)} disabled={!editData.id_empresa || loadingSelects.localizacao}>
                      <SelectTrigger className="h-12 font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <SelectValue placeholder={loadingSelects.localizacao ? "Carregando..." : "Selecione o local"} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                        {localizacoes.map(l => <SelectItem key={l.id_localizacao} value={String(l.id_localizacao)}>{l.ds_localizacao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 3. CATEGORIA, MOTIVO E DETALHE */}
                <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-indigo-600 dark:text-indigo-400">Categoria <span className="text-rose-500">*</span></label>
                      <Select value={String(editData.id_tipo_chamado)} onValueChange={v => setEditData("id_tipo_chamado", v)}>
                        <SelectTrigger className="h-11 font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                          {tiposChamado.map(t => <SelectItem key={t.id_tipo_chamado} value={String(t.id_tipo_chamado)}>{t.ds_tipo_chamado}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Motivo <span className="text-rose-500">*</span></label>
                      <Select value={String(editData.id_motivo_principal)} onValueChange={v => setEditData("id_motivo_principal", v)} disabled={!editData.id_tipo_chamado || loadingSelects.motivo}>
                        <SelectTrigger className="h-11 font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectValue placeholder="Motivo" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                          {motivos.map(m => <SelectItem key={m.id_motivo_principal} value={String(m.id_motivo_principal)}>{m.ds_descricao}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Detalhamento <span className="text-rose-500">*</span></label>
                      <Select value={String(editData.id_motivo_associado)} onValueChange={v => setEditData("id_motivo_associado", v)} disabled={!editData.id_motivo_principal || loadingSelects.detalhe}>
                        <SelectTrigger className="h-11 font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectValue placeholder="Detalhe" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                          {detalhes.map(d => <SelectItem key={d.id_motivo_associado} value={String(d.id_motivo_associado)}>{d.ds_descricao_motivo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Condicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {editData.id_motivo_principal === "6" && (
                      <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest block mb-3">Solicitação <span className="text-rose-500">*</span></label>
                        <div className="flex gap-4">
                          {['1', '2', '3'].map((v) => (
                            <label key={v} className="flex items-center gap-2 cursor-pointer group">
                              <input type="radio" checked={editData.st_grau === v} onChange={() => setEditData('st_grau', v)} className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-rose-500 transition-colors">
                                {v === '1' ? 'Melhoria' : v === '2' ? 'Problema' : 'Cadastro'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {editData.id_tipo_chamado === "1" && (
                      <div className="p-4 bg-amber-50/50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                        <label className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-2">Nº Patrimônio</label>
                        <Input value={editData.ds_patrimonio} onChange={e => setEditData('ds_patrimonio', e.target.value)} placeholder="000000" className="h-10 bg-white dark:bg-slate-950 font-bold border-amber-200 dark:border-amber-900/50" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. DESCRIÇÃO */}
                <div className="space-y-3">
                  <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">Descrição Detalhada <span className="text-rose-500">*</span></label>
                  <Textarea
                    value={editData.ds_descricao}
                    onChange={e => setEditData("ds_descricao", e.target.value)}
                    rows={8}
                    className="resize-none text-base p-5 leading-relaxed bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner font-medium"
                  />
                </div>

                {/* 5. GESTÃO DE ARQUIVOS */}
                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-500" /> Gestão de Anexos
                  </h4>

                  {/* Arquivos Existentes */}
                  {chamado.anexos && chamado.anexos.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arquivos Atuais (Desmarque para excluir)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {chamado.anexos.map((anexo) => {
                          const isExcluded = editData.arquivos_excluidos.includes(anexo.id);
                          return (
                            <div 
                              key={anexo.id} 
                              onClick={() => toggleExcludeExistingFile(anexo.id)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group",
                                isExcluded 
                                  ? "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/50 opacity-60"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                              )}
                            >
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isExcluded ? "bg-rose-100 text-rose-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                                {isExcluded ? <X className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}
                              </div>
                              <span className={cn("text-xs font-bold truncate flex-1", isExcluded ? "text-rose-700 dark:text-rose-400 line-through" : "text-slate-700 dark:text-slate-300")}>
                                {anexo.name}
                              </span>
                              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", isExcluded ? "bg-rose-600 border-rose-600" : "border-slate-300 dark:border-slate-700")}>
                                {!isExcluded && <CheckCircle2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />}
                                {isExcluded && <X className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upload de Novos */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adicionar novos arquivos</label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 transition-colors relative group">
                      <input type="file" id="file-upload-edit" multiple className="hidden" onChange={handleFileChange} />
                      <label htmlFor="file-upload-edit" className="cursor-pointer flex flex-col items-center">
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Clique para anexar novos arquivos</span>
                      </label>
                    </div>

                    {editData.arquivos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {editData.arquivos.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 animate-in zoom-in-95">
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button type="button" onClick={() => removeNewFile(i)} className="hover:text-rose-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button 
                type="submit" 
                form="edit-ticket-form" 
                disabled={editProcessing} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 h-12 shadow-lg shadow-indigo-500/20"
              >
                {editProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ================= BOTÃO E JANELA DE CHAT FLUTUANTE ================= */}
        {canChat && (
          <>
            {/* Botão Flutuante Estendido */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={cn(
                "fixed bottom-6 right-6 h-14 rounded-full flex items-center justify-center shadow-2xl z-[60] transition-all duration-300",
                isChatOpen ? "bg-rose-500 w-14" : "bg-indigo-600 px-6 gap-2.5"
              )}
            >
              {isChatOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <>
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 text-white" />
                    {currentChat.filter(m => m.id_usuario !== auth.user.id_usuario && !m.dt_leitura).length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-indigo-600 rounded-full flex items-center justify-center text-[7px] font-bold text-white">
                        !
                      </span>
                    )}
                  </div>
                  <span className="text-white font-black uppercase tracking-[0.1em] text-[10px]">Chat do Chamado</span>
                </>
              )}
            </motion.button>

            {/* Janela do Chat */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.8, transformOrigin: 'bottom right' }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 100, scale: 0.8 }}
                  className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl z-[60] border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
                >
                  {/* Header do Janela */}
                  <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-xs uppercase tracking-wider">Chat de Dúvidas</h3>
                        <p className="text-[9px] opacity-80 font-bold uppercase flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Canal Privado
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Corpo do Chat */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
                    {/* Banner de Informação de Privacidade */}
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 mb-2 flex items-start gap-3">
                      <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                        Este é um canal direto e seguro. Comunique-se aqui com o solicitante ou técnico responsável; <span className="font-black underline">apenas vocês dois</span> têm acesso a este chat.
                      </p>
                    </div>

                    {currentChat.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <MessageSquare className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Nenhuma mensagem ainda.</p>
                        <p className="text-xs text-slate-400 mt-1">Envie uma mensagem para iniciar a conversa.</p>
                      </div>
                    ) : (
                      currentChat.map((msg, i) => {
                        const isMe = msg.id_usuario === auth.user.id_usuario;
                        
                        // Lógica de Divisor de Data
                        const msgDate = format(new Date(msg.dt_envio), 'yyyy-MM-dd');
                        const prevMsgDate = i > 0 ? format(new Date(currentChat[i-1].dt_envio), 'yyyy-MM-dd') : null;
                        const showDateSeparator = msgDate !== prevMsgDate;

                        return (
                          <React.Fragment key={i}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-6 gap-4 opacity-50">
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {format(new Date(msg.dt_envio), "dd 'de' MMMM", { locale: ptBR })}
                                </span>
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                              </div>
                            )}
                            <div className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                            {!isMe && (
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <Avatar className="w-5 h-5">
                                  {msg.usuario.ds_foto ? (
                                    <img src={`/storage/${msg.usuario.ds_foto}`} className="object-cover" />
                                  ) : (
                                    <AvatarFallback className="text-[8px] bg-indigo-500 text-white">{getInitials(msg.usuario.ds_nome)}</AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{msg.usuario.ds_nome}</span>
                              </div>
                            )}
                            <div className={cn(
                              "p-3.5 rounded-2xl text-sm shadow-sm relative",
                              isMe 
                                ? "bg-indigo-600 text-white rounded-tr-none" 
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
                            )}>
                              {msg.ds_mensagem && <p className="leading-relaxed font-medium">{msg.ds_mensagem}</p>}
                              
                              {msg.ds_caminho_arquivo && (
                                isChatImage(msg.ds_caminho_arquivo) ? (
                                  <a 
                                    href={`/storage/${msg.ds_caminho_arquivo}`} 
                                    target="_blank" 
                                    className="mt-2 block rounded-xl overflow-hidden border border-white/20 hover:scale-[1.02] transition-transform"
                                  >
                                    <img 
                                      src={`/storage/${msg.ds_caminho_arquivo}`} 
                                      alt="Chat Attachment" 
                                      className="max-w-full h-auto object-cover max-h-[200px] w-full"
                                    />
                                  </a>
                                ) : (
                                  <a 
                                    href={`/storage/${msg.ds_caminho_arquivo}`} 
                                    target="_blank" 
                                    className={cn(
                                      "mt-2 flex items-center gap-3 p-2.5 rounded-xl border transition-all", 
                                      isMe 
                                        ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" 
                                        : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-300"
                                    )}
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                      <FileIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] font-black uppercase tracking-tight opacity-70">Arquivo</span>
                                      <span className="text-[11px] font-bold truncate max-w-[120px]">Ver anexo</span>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                                  </a>
                                )
                              )}
                            </div>
                            <div className={cn("flex items-center gap-1.5 mt-1.5 px-1", isMe ? "justify-end" : "justify-start")}>
                              <span className="text-[9px] text-slate-400 font-bold">{format(new Date(msg.dt_envio), "HH:mm", { locale: ptBR })}</span>
                              {isMe && (
                                <div className="flex items-center">
                                  {msg.dt_leitura ? (
                                    <CheckCheck className="w-3 h-3 text-sky-400" />
                                  ) : (
                                    <Check className="w-3 h-3 text-slate-300" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input do Chat Janela */}
                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleSendChat} className="space-y-3">
                      {chatData.arquivo && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-bold border border-indigo-100 dark:border-indigo-800/50 w-full animate-in slide-in-from-bottom-2">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="flex-1 truncate">{chatData.arquivo.name}</span>
                          <button type="button" onClick={() => setChatData('arquivo', null)} className="hover:text-rose-500 p-1"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input type="file" id="chat-file-floating" className="hidden" onChange={(e) => setChatData('arquivo', e.target.files[0])} />
                          <label htmlFor="chat-file-floating" className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95">
                            <Paperclip className="w-5 h-5" />
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Sua mensagem..."
                          value={chatData.mensagem}
                          onChange={e => setChatData('mensagem', e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl px-5 h-11 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-200 placeholder:font-medium"
                        />
                        <Button 
                          type="submit" 
                          disabled={chatProcessing || (!chatData.mensagem && !chatData.arquivo)} 
                          className="w-11 h-11 rounded-2xl p-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 shrink-0 active:scale-95"
                        >
                          {chatProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// Subcomponente para as informações laterais do chamado
function InfoCard({ chamado, getInitials }) {
  return (
    <Card className="shadow-sm border-t-4 border-t-indigo-500 dark:border-slate-800 bg-white dark:bg-slate-900">
      <CardHeader className="pb-2 border-b border-slate-50 dark:border-slate-800/50">
        <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Mais informações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* SOLICITANTE */}
        <div className="flex gap-4 items-center">
          <Avatar className="w-12 h-12 border-2 border-indigo-100 dark:border-indigo-900 shadow-sm">
            {chamado.ds_foto_solicitante ? (
              <img src={`/storage/${chamado.ds_foto_solicitante}`} className="aspect-square h-full w-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold">
                {getInitials(chamado.ds_nome_solicitante)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Solicitante</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{chamado.ds_nome_solicitante || "-"}</span>
          </div>
        </div>

        {/* TÉCNICO RESPONSÁVEL */}
        <div className="flex gap-4 items-center pt-4 border-t border-slate-800/50">
          <Avatar className="w-12 h-12 border-2 border-amber-100 dark:border-amber-900 shadow-sm">
            {chamado.ds_foto_tecnico ? (
              <img src={`/storage/${chamado.ds_foto_tecnico}`} className="aspect-square h-full w-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold">
                {chamado.ds_nome_tecnico ? getInitials(chamado.ds_nome_tecnico) : "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Técnico Responsável</span>
            <span className={cn("text-sm font-bold", chamado.ds_nome_tecnico ? "text-slate-700 dark:text-slate-200" : "text-slate-400 italic")}>
              {chamado.ds_nome_tecnico || "Aguardando atribuição"}
            </span>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

        {/* EMPRESA */}
        <div className="flex gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Empresa</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{chamado.ds_nome_empresa || "-"}</span>
          </div>
        </div>

        {/* LOCALIZAÇÃO */}
        <div className="flex gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Localização</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{chamado.ds_localizacao || "-"}</span>
          </div>
        </div>

        {/* DATA */}
        <div className="flex gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data de Abertura</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {format(new Date(chamado.dt_data_chamado), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}