import React, { useState, useRef } from "react";
import { router, usePage, Head, useForm } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Switch } from "@/Components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { useTheme } from "@/components/providers/ThemeProvider";
import { toast } from "sonner";
import CropImageModal from "@/Components/CropImageModal";
// 👇 ADICIONE ESTA IMPORTAÇÃO QUE ESTAVA FALTANDO
import { cn } from "@/lib/utils";
import {
  Palette,
  Bell,
  MapPin,
  Building2,
  Moon,
  Sun,
  PanelLeftClose,
  Loader2,
  MessageCircle,
  Globe,
  Mail,
  User,
  Camera,
  Upload,
  Lock,
  Shield,
  Phone,
  KeyRound,
  Settings2,
  Volume2
} from "lucide-react";
import { Button } from "@/Components/ui/button";

export default function Configuracoes({ empresas, localizacoes }) {
  // ... o restante do código permanece igual ...
  const { auth } = usePage().props;
  const perfilId = auth.user.id_perfil;
  const { darkMode, menuCompacto, setDarkMode, setMenuCompacto } = useTheme();

  // Helper de permissões para exibição de eventos
  const isAdmin = perfilId === 1 || perfilId === 5;
  const isTecnico = perfilId === 4;
  const isGestor = perfilId === 3;
  const isSolicitante = perfilId === 2;

  // Garante que prefs é um objeto, mesmo se vier null do banco
  const prefs = auth.user.preferencias || {};

  const [isProcessing, setIsProcessing] = useState(false);

  // 1. CONFIGURAÇÕES DE CANAIS (Email, Whats, Browser + Som)
  const [canais, setCanais] = useState({
    canal_email: prefs.canal_email ?? true,
    canal_whatsapp: prefs.canal_whatsapp ?? false,
    canal_navegador: prefs.canal_navegador ?? true,
    notificacao_som: prefs.notificacao_som ?? true,
  });

  // 2. CONFIGURAÇÕES DE EVENTOS (Quando avisar)
  const [eventos, setEventos] = useState({
    evt_novo_chamado: prefs.evt_novo_chamado ?? true,
    evt_chamado_atribuido: prefs.evt_chamado_atribuido ?? true,
    evt_mudanca_status: prefs.evt_mudanca_status ?? true,
    evt_resumo_diario: prefs.evt_resumo_diario ?? false,
    evt_chat_chamado: prefs.evt_chat_chamado ?? true,
    evt_novo_comentario: prefs.evt_novo_comentario ?? true,
    evt_edicao_chamado: prefs.evt_edicao_chamado ?? true,
  });

  // 3. PADRÕES DE ABERTURA
  const [padroes, setPadroes] = useState({
    id_empresa_padrao: prefs.id_empresa_padrao ? String(prefs.id_empresa_padrao) : "",
    id_localizacao_padrao: prefs.id_localizacao_padrao ? String(prefs.id_localizacao_padrao) : "",
  });

  // Sincroniza estados locais quando os dados do Inertia mudam (ex: após salvar)
  React.useEffect(() => {
    const p = auth.user.preferencias || {};
    setCanais({
        canal_email: p.canal_email ?? true,
        canal_whatsapp: p.canal_whatsapp ?? false,
        canal_navegador: p.canal_navegador ?? true,
        notificacao_som: p.notificacao_som ?? true,
    });
    setEventos({
        evt_novo_chamado: p.evt_novo_chamado ?? true,
        evt_chamado_atribuido: p.evt_chamado_atribuido ?? true,
        evt_mudanca_status: p.evt_mudanca_status ?? true,
        evt_resumo_diario: p.evt_resumo_diario ?? false,
        evt_chat_chamado: p.evt_chat_chamado ?? true,
        evt_novo_comentario: p.evt_novo_comentario ?? true,
        evt_edicao_chamado: p.evt_edicao_chamado ?? true,
    });
    setPadroes({
        id_empresa_padrao: p.id_empresa_padrao ? String(p.id_empresa_padrao) : "",
        id_localizacao_padrao: p.id_localizacao_padrao ? String(p.id_localizacao_padrao) : "",
    });
  }, [auth.user.preferencias]);

  // Lógica de Foto de Perfil
  const fileInputRef = useRef(null);
  const { data: photoData, setData: setPhotoData, post: postPhoto, processing: photoProcessing } = useForm({
    foto: null,
  });

  // Novos estados para o Modal de Crop
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result);
        setIsCropOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    router.post(route('configuracoes.update-photo'), { foto: croppedFile }, {
        forceFormData: true,
        onSuccess: () => toast.success("Foto de perfil atualizada!"),
        onError: (err) => {
            console.error(err);
            toast.error("Erro ao enviar foto: " + (err.foto || "Erro desconhecido"));
        },
    });
  };

  // Lógica de Troca de Senha
  const { data: passwordData, setData: setPasswordData, put: putPassword, processing: passwordProcessing, errors: passwordErrors, reset: resetPassword } = useForm({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    putPassword(route('configuracoes.update-password'), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Senha alterada com sucesso!");
        resetPassword();
      },
      onError: () => toast.error("Verifique os erros no formulário."),
    });
  };

  // Lógica de Atualização do Perfil (Nome e Telefone)
  const formatPhone = (val) => {
    if (!val) return "";
    let value = String(val).replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value.slice(0, 15);
  };

  const { data: profileData, setData: setProfileData, patch: patchProfile, processing: profileProcessing, errors: profileErrors } = useForm({
    ds_nome: auth.user.ds_nome || "",
    nu_telefone: formatPhone(auth.user.nu_telefone || ""),
  });

  // Sincroniza formulário de perfil se os dados mudarem via backend
  React.useEffect(() => {
    setProfileData({
        ds_nome: auth.user.ds_nome || "",
        nu_telefone: formatPhone(auth.user.nu_telefone || ""),
    });
  }, [auth.user.ds_nome, auth.user.nu_telefone]);

  const handleProfilePhoneChange = (e) => {
    setProfileData('nu_telefone', formatPhone(e.target.value));
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    patchProfile(route('configuracoes.update-profile'), {
      preserveScroll: true,
      onSuccess: () => toast.success("Perfil atualizado com sucesso!"),
      onError: () => toast.error("Verifique os erros no formulário."),
    });
  };

  // Filtra localizações baseado na empresa selecionada
  const localizacoesFiltradas = localizacoes.filter(
    l => String(l.id_empresa) === padroes.id_empresa_padrao
  );

  // =========================================================
  // FUNÇÃO UNIFICADA DE SALVAR
  // =========================================================
  const handleSave = (key, value, group = null) => {
    setIsProcessing(true);

    // Envia para o backend (Controller vai fazer o merge no JSON)
    router.patch(route('configuracoes.update'), { [key]: value }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsProcessing(false);
        // Atualiza o estado local apenas no sucesso para evitar "flicker"
        if (group === 'canais') setCanais(prev => ({ ...prev, [key]: value }));
        else if (group === 'eventos') setEventos(prev => ({ ...prev, [key]: value }));
        else if (group === 'padroes') setPadroes(prev => ({ ...prev, [key]: value }));
      },
      onError: () => {
        toast.error("Erro ao salvar preferência.");
        setIsProcessing(false);
      }
    });
  };

  // Lógica especial para limpar localização se trocar empresa
  const handleEmpresaChange = (val) => {
    setIsProcessing(true);
    // Salva a empresa e limpa a localização no banco num único request
    router.patch(route('configuracoes.update'), {
        id_empresa_padrao: val,
        id_localizacao_padrao: null
    }, { 
        preserveScroll: true,
        onSuccess: () => {
            setIsProcessing(false);
            setPadroes(prev => ({ ...prev, id_empresa_padrao: val, id_localizacao_padrao: "" }));
        },
        onError: () => setIsProcessing(false)
    });
  };

  return (
    <AppLayout>
      <Head title="Minhas Configurações" />

      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Personalize sua experiência no sistema.
          </p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800 grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1">
            <TabsTrigger value="perfil" className="gap-2 py-2.5"><User className="w-4 h-4" /> Perfil</TabsTrigger>
            <TabsTrigger value="padroes" className="gap-2 py-2.5"><Settings2 className="w-4 h-4" /> Preferências</TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2 py-2.5"><Bell className="w-4 h-4" /> Notificações</TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2 py-2.5"><Shield className="w-4 h-4" /> Segurança</TabsTrigger>
          </TabsList>

          {/* 0. ABA PERFIL */}
          <TabsContent value="perfil" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-indigo-500" /> Informações Pessoais
                </CardTitle>
                <CardDescription>Gerencie suas informações básicas e foto de perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                        <Avatar className="w-24 h-24 ring-4 ring-slate-100 dark:ring-slate-700 shadow-xl">
                            {auth.user.ds_foto ? (
                                <img src={`/storage/${auth.user.ds_foto}`} alt={auth.user.ds_nome} className="aspect-square h-full w-full object-cover" />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-2xl font-bold">
                                    {auth.user.ds_nome?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoProcessing}
                            className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all transform hover:scale-110 disabled:opacity-50"
                        >
                            {photoProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handlePhotoChange} 
                        />
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{auth.user.ds_nome}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-slate-500 dark:text-slate-400 text-sm">
                            <span className="flex items-center gap-1 justify-center sm:justify-start"><Mail className="w-3.5 h-3.5" /> {auth.user.ds_email}</span>
                            {auth.user.nu_telefone && (
                                <span className="flex items-center gap-1 justify-center sm:justify-start"><Phone className="w-3.5 h-3.5" /> {formatPhone(auth.user.nu_telefone)}</span>
                            )}
                        </div>
                        <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded inline-block mt-2">
                            {auth.user.ds_usuario}
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Nome Completo</Label>
                                <Input 
                                    value={profileData.ds_nome} 
                                    onChange={e => setProfileData('ds_nome', e.target.value)}
                                    className={cn(profileErrors.ds_nome && "border-rose-500")}
                                />
                                {profileErrors.ds_nome && <p className="text-rose-500 text-[10px] font-bold">{profileErrors.ds_nome}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Telefone / WhatsApp</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        value={profileData.nu_telefone} 
                                        onChange={handleProfilePhoneChange}
                                        placeholder="(00) 00000-0000"
                                        className={cn("pl-10", profileErrors.nu_telefone && "border-rose-500")}
                                        maxLength={15}
                                    />
                                </div>
                                {profileErrors.nu_telefone && <p className="text-rose-500 text-[10px] font-bold">{profileErrors.nu_telefone}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={profileProcessing} className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 font-bold px-8">
                                {profileProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Alterações"}
                            </Button>
                        </div>
                    </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 1. ABA PADRÕES */}
          <TabsContent value="padroes" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-indigo-500" /> Abertura de Chamados
                </CardTitle>
                <CardDescription>Estes valores virão pré-selecionados ao abrir um novo chamado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Empresa Favorita</Label>
                    <Select value={padroes.id_empresa_padrao} onValueChange={handleEmpresaChange}>
                      <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {empresas.map(e => <SelectItem key={e.id_empresa} value={String(e.id_empresa)}>{e.ds_empresa}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Localização Favorita</Label>
                    <Select
                        value={padroes.id_localizacao_padrao}
                        onValueChange={(v) => handleSave('id_localizacao_padrao', v, 'padroes')}
                        disabled={!padroes.id_empresa_padrao}
                    >
                      <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {localizacoesFiltradas.map(l => <SelectItem key={l.id_localizacao} value={String(l.id_localizacao)}>{l.ds_localizacao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. ABA APARÊNCIA (Local Only - Não salva no banco, usa Context) */}
          <TabsContent value="aparencia" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Palette className="w-5 h-5 text-indigo-500" /> Visual</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        {darkMode ? <Moon className="text-indigo-400 w-6 h-6" /> : <Sun className="text-amber-500 w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Modo Escuro</p>
                      <p className="text-sm text-slate-500">Alterne entre tema claro e escuro</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={(val) => setDarkMode(val)} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <PanelLeftClose className={cn("w-6 h-6", menuCompacto ? "text-indigo-500" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Menu Compacto</p>
                      <p className="text-sm text-slate-500">Recolher a barra lateral automaticamente</p>
                    </div>
                  </div>
                  <Switch checked={menuCompacto} onCheckedChange={(val) => setMenuCompacto(val)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. ABA NOTIFICAÇÕES (Completa: Canais + Eventos) */}
          <TabsContent value="notificacoes" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

            {/* SEÇÃO CANAIS */}
            <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Canais de Recebimento</CardTitle>
                <CardDescription>Por onde você deseja receber os alertas?</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"><MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                    <Label className="text-base font-medium">WhatsApp</Label>
                  </div>
                  <Switch checked={canais.canal_whatsapp} onCheckedChange={(v) => handleSave('canal_whatsapp', v, 'canais')} />
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg"><Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                    <Label className="text-base font-medium">E-mail Corporativo</Label>
                  </div>
                  <Switch checked={canais.canal_email} onCheckedChange={(v) => handleSave('canal_email', v, 'canais')} />
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg"><Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
                    <Label className="text-base font-medium">Navegador (Push)</Label>
                  </div>
                  <Switch checked={canais.canal_navegador} onCheckedChange={(v) => handleSave('canal_navegador', v, 'canais')} />
                </div>
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg"><Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
                    <div className="flex flex-col">
                      <Label className="text-base font-medium">Som de Notificação</Label>
                      <button 
                        onClick={() => {
                          console.log("Iniciando teste de som...");
                          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                          audio.play()
                            .then(() => console.log("Som reproduzido com sucesso!"))
                            .catch(e => {
                              console.error("Falha ao tocar som:", e);
                              toast.error("Erro ao tocar som. Verifique se o volume está alto e se a aba não está mutada.");
                            });
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline text-left"
                      >
                        Testar som agora
                      </button>
                    </div>
                  </div>
                  <Switch checked={canais.notificacao_som} onCheckedChange={(v) => handleSave('notificacao_som', v, 'canais')} />
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO EVENTOS */}
            <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Eventos e Gatilhos</CardTitle>
                <CardDescription>Em quais situações devemos te notificar?</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                
                {/* Eventos para Técnicos e Admins */}
                {(isTecnico || isAdmin) && (
                    <NotificationRow
                        label="Quando abrirem um Novo Chamado"
                        checked={eventos.evt_novo_chamado}
                        onChange={(v) => handleSave('evt_novo_chamado', v, 'eventos')}
                    />
                )}

                {/* Eventos de Atribuição (Não mostramos para solicitantes/gestores pois não recebem atribuição direta no workflow técnico) */}
                {(!isSolicitante && !isGestor) && (
                    <NotificationRow
                        label="Quando um chamado for atribuído a mim"
                        checked={eventos.evt_chamado_atribuido}
                        onChange={(v) => handleSave('evt_chamado_atribuido', v, 'eventos')}
                    />
                )}

                {/* Mudança de Status (Foco no solicitante e gestor) */}
                {(isSolicitante || isGestor) && (
                    <NotificationRow
                        label="Quando o status do meu chamado for alterado"
                        checked={eventos.evt_mudanca_status}
                        onChange={(v) => handleSave('evt_mudanca_status', v, 'eventos')}
                    />
                )}

                {/* Eventos de Chat (Técnicos e Solicitantes/Gestores) */}
                {(isTecnico || isSolicitante || isGestor || isAdmin) && (
                    <NotificationRow
                        label="Novas mensagens no Chat Privado"
                        checked={eventos.evt_chat_chamado}
                        onChange={(v) => handleSave('evt_chat_chamado', v, 'eventos')}
                    />
                )}

                {/* Comentários/Observações (Todos) */}
                <NotificationRow
                    label="Nova observação pública no chamado"
                    checked={eventos.evt_novo_comentario}
                    onChange={(v) => handleSave('evt_novo_comentario', v, 'eventos')}
                />

                {/* Edição (Solicitantes/Gestores e Responsáveis) */}
                <NotificationRow
                    label="Quando o conteúdo do chamado for editado"
                    checked={eventos.evt_edicao_chamado}
                    onChange={(v) => handleSave('evt_edicao_chamado', v, 'eventos')}
                />

                {/* Resumo (Admins e Técnicos) */}
                {(isAdmin || isTecnico) && (
                    <NotificationRow
                        label="Receber Resumo Diário (Manhã)"
                        checked={eventos.evt_resumo_diario}
                        onChange={(v) => handleSave('evt_resumo_diario', v, 'eventos')}
                    />
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* 4. ABA SEGURANÇA */}
          <TabsContent value="seguranca" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info lateral */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 bg-indigo-50/30 dark:bg-indigo-500/5">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Segurança da Conta</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Recomendamos alterar sua senha a cada 90 dias para manter seus dados protegidos. 
                                Use uma combinação de letras, números e símbolos.
                            </p>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Senha criptografada
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Acesso autenticado
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Formulário Principal */}
                <Card className="lg:col-span-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-indigo-500" /> Alterar Senha de Acesso
                        </CardTitle>
                        <CardDescription>Preencha os campos abaixo para atualizar suas credenciais.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Senha Atual</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        type="password" 
                                        placeholder="Digite sua senha atual"
                                        value={passwordData.current_password} 
                                        onChange={e => setPasswordData('current_password', e.target.value)}
                                        className={cn(
                                            "pl-10 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-indigo-500", 
                                            passwordErrors.current_password && "border-rose-500"
                                        )}
                                    />
                                </div>
                                {passwordErrors.current_password && <p className="text-rose-500 text-[10px] font-bold">{passwordErrors.current_password}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nova Senha</Label>
                                    <Input 
                                        type="password" 
                                        placeholder="Mínimo 8 caracteres"
                                        value={passwordData.password} 
                                        onChange={e => setPasswordData('password', e.target.value)}
                                        className={cn(
                                            "h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-indigo-500", 
                                            passwordErrors.password && "border-rose-500"
                                        )}
                                    />
                                    {passwordErrors.password && <p className="text-rose-500 text-[10px] font-bold">{passwordErrors.password}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirmar Nova Senha</Label>
                                    <Input 
                                        type="password" 
                                        placeholder="Repita a nova senha"
                                        value={passwordData.password_confirmation} 
                                        onChange={e => setPasswordData('password_confirmation', e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 mt-6">
                                <p className="text-[11px] text-slate-400 italic">
                                    Atenção: Ao salvar, sua sessão poderá ser encerrada por segurança.
                                </p>
                                <Button type="submit" disabled={passwordProcessing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]">
                                    {passwordProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Nova Senha"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>

        {isProcessing && (
          <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-indigo-100 dark:border-slate-700 animate-in zoom-in duration-300 z-50">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        )}

        <CropImageModal
          open={isCropOpen}
          onOpenChange={setIsCropOpen}
          image={selectedImage}
          onCropComplete={handleCropComplete}
        />
      </div>
    </AppLayout>
  );
}

// Subcomponente simples para linhas de notificação
function NotificationRow({ label, checked, onChange }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
            <Label className="text-base font-medium text-slate-700 dark:text-slate-300">{label}</Label>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}