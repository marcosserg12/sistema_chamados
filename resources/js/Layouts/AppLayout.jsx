import React, { useState, useEffect, useRef } from "react";
// 1. IMPORTAÇÕES DO INERTIA E REACT
import { Link, usePage, router } from "@inertiajs/react";
import axios from "axios";
import { ThemeProvider, useTheme } from "@/Components/providers/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Ticket,
  Package,
  Building2,
  Users,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Plus,
  Moon,
  Sun,
  Shield,
  Wrench,
  UserCircle,
  MapPin,
  ListTree,
  Phone,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Info
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/Components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import { cn } from "@/lib/utils";
import TechChat from "@/Components/TechChat";

// Flag global para persistir o estado de desbloqueio de áudio entre navegações SPA (Inertia)
let isAudioUnlockedGlobal = false;

// 2. FUNÇÃO QUE GERA OS MENUS DE ACORDO COM O PERFIL
const getNavigationGroups = (perfilId) => {
  // O Perfil 5 (Super Admin) tem acesso a tudo.
  const isSuperAdmin = perfilId === 5;
  const isAdmin = perfilId === 1;
  const isTecnico = perfilId === 4;

  return [
    {
      title: "Principal",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true }, // Todos veem
        { name: "Chamados", href: "/chamados", icon: Ticket, show: true }, // Todos veem
      ]
    },
    {
      title: "Gestão",
      items: [
        { name: "Patrimônios", href: "/patrimonios", icon: Package, show: isAdmin || isSuperAdmin },
        // { name: "Ordens de Serviço", href: "/ordens-servico", icon: FileText, show: isAdmin || isSuperAdmin },
      ]
    },
    {
      title: "Cadastros",
      items: [
        { name: "Empresas", href: "/empresas", icon: Building2, show: isSuperAdmin }, // Apenas perfil 5
        { name: "Usuários", href: "/usuarios", icon: Users, show: isAdmin || isSuperAdmin },
        { name: "Localizações", href: "/localizacoes", icon: MapPin, show: isAdmin || isSuperAdmin }, // Adicionado!
        { name: "Motivos", href: "/configuracao/motivos", icon: ListTree, show: isAdmin || isSuperAdmin }, // Adicionado!
      ]
    },
    {
      title: "Dashboards",
      items: [
        { name: "Visão Admin", href: "/dashboard/admin", icon: Shield, show: isAdmin || isSuperAdmin },
        { name: "Visão Técnico", href: "/dashboard/tecnico", icon: Wrench, show: isTecnico || isSuperAdmin },
        // { name: "Visão Cliente", href: "/dashboard/cliente", icon: UserCircle, show: isAdmin || isSuperAdmin }, // Prompt indicou perfil 1 e 5
      ]
    }
  ];
};

function LayoutContent({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para Busca Global
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Estados para Notificações
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Usamos useRef para que o valor seja sempre o mais atualizado dentro do setInterval (evita closure stale)
  const lastNotificationIdRef = useRef(localStorage.getItem("last_notif_id"));
  const audioRef = useRef(null);

  // 3. CAPTURA DOS DADOS DO LARAVEL E INERTIA
  const { props, url } = usePage();
  const user = props.auth?.user;
  const perfilId = user?.id_perfil; // Captura o perfil do usuário logado

  const { darkMode, menuCompacto, toggleDarkMode, toggleMenuCompacto } = useTheme();

  // Verificação de troca de senha obrigatória no primeiro acesso
  const [showPassModal, setShowPassModal] = useState(false);
  
  useEffect(() => {
    // Se logado, não alterou a senha e não está na página de configurações
    if (user && user.preferencias?.senha_alterada === false && url !== '/configuracoes') {
        setShowPassModal(true);
    } else {
        setShowPassModal(false);
    }
  }, [user, url]);

  // "Desbloqueia" o áudio no primeiro clique do usuário (Exigência dos navegadores)
  useEffect(() => {
    // Se já desbloqueamos nesta sessão (mesmo mudando de página), não fazemos de novo
    if (isAudioUnlockedGlobal) return;

    const unlockAudio = () => {
      if (audioRef.current) {
        // Toca e pausa IMEDIATAMENTE com volume 0 para o navegador autorizar o canal de áudio
        const originalVolume = audioRef.current.volume;
        audioRef.current.volume = 0;

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            audioRef.current.pause();
            audioRef.current.volume = originalVolume;
            audioRef.current.currentTime = 0;
            isAudioUnlockedGlobal = true; // Marca como desbloqueado globalmente
          }).catch(() => {});
        }
        document.removeEventListener("click", unlockAudio);
      }
    };
    document.addEventListener("click", unlockAudio);
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  // Função para tocar o som de notificação
  const playNotificationSound = () => {
    if (user?.preferencias?.notificacao_som !== false) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn("Som bloqueado. Interaja com a página primeiro.", e);
          });
        }
      }
    }
  };

  // Solicitar permissão do navegador ao montar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Efeito para carregar notificações iniciais
  useEffect(() => {
    fetchNotifications(true); // true = primeira carga
    // Polling a cada 60 segundos
    const interval = setInterval(() => fetchNotifications(false), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (initial = false) => {
    try {
      const response = await axios.get("/api/notifications");
      const newNotifications = response.data.notifications;
      const newUnreadCount = response.data.unreadCount;

      if (newNotifications.length > 0) {
        const latestNotif = newNotifications[0];

        // Só toca som se:
        // 1. Não for a carga inicial da página (na carga inicial apenas registramos o ID atual)
        // 2. O ID for diferente do último que avisamos (usando a Ref atualizada)
        // 3. Estiver não lida
        // 4. For RECENTE (criada nos últimos 3 minutos)
        const isRecent = (new Date() - new Date(latestNotif.created_at)) < 180000;

        if (!initial && latestNotif.id !== lastNotificationIdRef.current && !latestNotif.read_at && isRecent) {
          playNotificationSound();

          if (user?.preferencias?.canal_navegador !== false && Notification.permission === "granted") {
            // Título e mensagem vindos diretamente do banco de dados (Laravel Notification)
            const title = latestNotif.data.title || "Nova Notificação";
            const message = latestNotif.data.message || latestNotif.data.ds_descricao || "";
            const targetUrl = latestNotif.data.url;

            const n = new Notification(title, {
              body: message,
              icon: "/favicon.ico",
              tag: latestNotif.id,
              silent: true,
              data: { url: targetUrl } // Guardamos a URL nos metadados da notificação
            });

            // Ao clicar na notificação nativa (Windows/Browser)
            n.onclick = (e) => {
              e.preventDefault();
              window.focus(); // Traz o navegador para frente
              if (targetUrl) {
                router.visit(targetUrl); // Navega para o chamado
              }
              n.close();
            };
          }
        }

        // Atualiza a Ref e o localStorage IMEDIATAMENTE
        lastNotificationIdRef.current = latestNotif.id;
        localStorage.setItem("last_notif_id", latestNotif.id);
      }

      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  };

  const markNotificationAsRead = async (id, url = null) => {
    try {
      await axios.post(`/api/notifications/${id}/read`);
      fetchNotifications();
      if (url) {
        router.visit(url);
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const deleteNotification = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post("/api/notifications/read-all");
      fetchNotifications();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  // Lógica de Busca com Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/search?q=${searchQuery}`);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPhone = (val) => {
    if (!val) return "";
    let value = String(val).replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value.slice(0, 15);
  };

  const getInitials = (name) => {
    if (!name) return "MS";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const sidebarWidth = menuCompacto ? "w-[72px]" : "w-64";
  const mainPadding = menuCompacto ? "lg:pl-[72px]" : "lg:pl-64";

  // 4. FILTRA OS MENUS ANTES DE RENDERIZAR
  const filteredNavigation = getNavigationGroups(perfilId)
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.show) // Mantém apenas os permitidos
    }))
    .filter(group => group.items.length > 0); // Remove o grupo inteiro se ficar vazio (ex: "Gestão" para perfil comum)

  return (
    <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200")}>
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: menuCompacto ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarWidth
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0",
          menuCompacto ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3">
            {!menuCompacto ? (
              <img src="/images/grupo_ibra.png" alt="Grupo Ibra" className="h-16 w-auto object-contain dark:brightness-0 dark:invert transition-all" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                <img src="/images/favicon.png" className="w-8 h-8 invert brightness-0" alt="Ibra" />
              </div>
            )}
          </Link>
          {!menuCompacto && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Quick action */}
        <div className={cn("px-3 py-4 flex-shrink-0", menuCompacto && "px-2")}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/chamados/novo">
                  <Button className={cn(
                    "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20",
                    menuCompacto ? "w-full h-11 px-0" : "w-full gap-2 h-11"
                  )}>
                    <Plus className="w-5 h-5" />
                    {!menuCompacto && <span className="font-medium">Novo Chamado</span>}
                  </Button>
                </Link>
              </TooltipTrigger>
              {menuCompacto && (
                <TooltipContent side="right">
                  Novo Chamado
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-2", menuCompacto ? "px-2" : "px-3")}>
          <TooltipProvider delayDuration={0}>
            {/* 5. AGORA RENDERIZA APENAS O ARRAY FILTRADO */}
            {filteredNavigation.map((group, groupIndex) => (
              <div key={group.title} className={cn(groupIndex > 0 && "mt-6")}>
                {!menuCompacto && (
                  <p className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {group.title}
                  </p>
                )}
                {menuCompacto && groupIndex > 0 && (
                  <div className="h-px bg-slate-200 dark:bg-slate-700 my-3 mx-2" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = url === item.href || url?.startsWith(item.href + '/');

                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                              menuCompacto && "justify-center px-0",
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                            )}
                          >
                            <item.icon className={cn(
                              "w-5 h-5 flex-shrink-0 transition-colors",
                              isActive ? "text-blue-600 dark:text-blue-400" : ""
                            )} />
                            {!menuCompacto && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        {menuCompacto && (
                          <TooltipContent side="right" className="font-medium">
                            {item.name}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </TooltipProvider>
        </nav>

        {/* Bottom section */}
        <div className={cn("flex-shrink-0 border-t border-slate-100 dark:border-slate-700", menuCompacto ? "p-2" : "p-4")}>
          <div className="flex flex-col gap-1">
            {/* Collapse action */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={menuCompacto ? "icon" : "sm"}
                    onClick={toggleMenuCompacto}
                    className={cn(
                      "w-full gap-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors",
                      menuCompacto ? "h-10 justify-center" : "h-9 justify-start px-3"
                    )}
                  >
                    <ChevronLeft className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      menuCompacto && "rotate-180"
                    )} />
                    {!menuCompacto && <span className="text-xs font-medium uppercase tracking-wider">Recolher menu</span>}
                  </Button>
                </TooltipTrigger>
                {menuCompacto && <TooltipContent side="right">Expandir menu</TooltipContent>}
              </Tooltip>
            </TooltipProvider>

            {/* Quick Actions (Settings & Theme) */}
            <div className={cn("flex items-center gap-1", menuCompacto ? "flex-col" : "justify-between mt-1")}>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/configuracoes" className={menuCompacto ? "w-full" : "flex-1"}>
                      <Button
                        variant="ghost"
                        size={menuCompacto ? "icon" : "sm"}
                        className={cn(
                          "w-full gap-3 text-slate-500 hover:text-slate-900 dark:hover:text-white",
                          menuCompacto ? "h-10 justify-center" : "h-9 justify-start px-3"
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        {!menuCompacto && <span className="text-xs font-medium uppercase tracking-wider">Ajustes</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {menuCompacto && <TooltipContent side="right">Configurações</TooltipContent>}
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleDarkMode}
                      className={cn(
                        "text-slate-500 hover:text-slate-900 dark:hover:text-white",
                        menuCompacto ? "h-10 w-full justify-center" : "h-9 w-9 shrink-0"
                      )}
                    >
                      {darkMode ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {darkMode ? "Modo Claro" : "Modo Escuro"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* User Profile */}
            <div className={cn(
              "flex items-center gap-3 mt-3 rounded-xl transition-all duration-300",
              menuCompacto ? "justify-center p-1" : "p-2 bg-slate-50 dark:bg-slate-800/50"
            )}>
              <Avatar className={cn(
                "flex-shrink-0 ring-2 ring-white dark:ring-slate-700 transition-all",
                menuCompacto ? "w-8 h-8" : "w-9 h-9"
              )}>
                {user?.ds_foto ? (
                  <img src={`/storage/${user.ds_foto}`} alt={user.ds_nome} className="aspect-square h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold">
                    {getInitials(user?.ds_nome)}
                  </AvatarFallback>
                )}
              </Avatar>
              {!menuCompacto && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.ds_nome || "Usuário"}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {user?.ds_email}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className={cn(mainPadding, "transition-all duration-200")}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="hidden sm:block relative w-80" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={
                    perfilId === 1 || perfilId === 5
                      ? "Buscar chamados, patrimônios, usuários..."
                      : "Buscar chamados..."
                  }
                  className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-600 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                  }}
                />
                <AnimatePresence>
                  {showSearchResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto"
                    >
                      {isSearching && (
                        <div className="p-4 text-sm text-slate-500 text-center">Buscando...</div>
                      )}
                      {!isSearching && searchResults.length === 0 && searchQuery.length > 1 && (
                        <div className="p-4 text-sm text-slate-500 text-center">Nenhum resultado encontrado.</div>
                      )}
                      {searchResults.map((result) => (
                        <Link
                          key={`${result.type}-${result.id}`}
                          href={result.url}
                          onClick={() => setShowSearchResults(false)}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b last:border-b-0 border-slate-100 dark:border-slate-700"
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            result.type === 'Chamado' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                            result.type === 'Patrimônio' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          )}>
                            {result.type === 'Chamado' ? <Ticket className="w-4 h-4" /> :
                             result.type === 'Patrimônio' ? <Package className="w-4 h-4" /> :
                             <Users className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {result.subtitle} • <span className="text-blue-500">{result.type}</span>
                            </p>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Regras do Sistema" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
                  <DialogHeader className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                    <DialogTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Info className="w-4 h-4 text-white" />
                      </div>
                      Regras e Orientações
                    </DialogTitle>
                  </DialogHeader>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950/50">
                    <div className="rounded-xl overflow-hidden shadow-xl bg-white dark:bg-slate-900">
                      <img
                        src="/images/regra_chamados.jpg"
                        alt="Regras de Atendimento"
                        className="w-full h-auto object-contain max-h-[85vh]"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-800">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-0 overflow-hidden border-slate-200 dark:border-slate-700">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          markAllAsRead();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Limpar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">Sem novas notificações</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "group flex items-start gap-1 p-4 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors relative",
                            !notification.read_at ? "bg-blue-50/30 dark:bg-blue-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-700/50"
                          )}
                          onClick={() => markNotificationAsRead(notification.id, notification.data.url)}
                        >
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex w-full justify-between items-start gap-2">
                              <span className={cn(
                                "text-sm truncate",
                                !notification.read_at ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-400"
                              )}>
                                {notification.data.title || "Nova Notificação"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {notification.data.message || notification.data.ds_descricao || ""}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {!notification.read_at && (
                            <div className="absolute top-4 right-10 w-2 h-2 bg-blue-500 rounded-full" />
                          )}

                          <div className="absolute top-3 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markNotificationAsRead(notification.id);
                              }}
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-400 hover:text-blue-500 shadow-sm transition-all"
                              title="Marcar como lida"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => deleteNotification(e, notification.id)}
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-400 hover:text-rose-500 shadow-sm transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-center bg-slate-50/50 dark:bg-slate-800/50">
                    <Link
                      href="/notificacoes"
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Ver todas notificações
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Avatar className="w-8 h-8">
                      {user?.ds_foto ? (
                        <img src={`/storage/${user.ds_foto}`} alt={user.ds_nome} className="aspect-square h-full w-full object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-medium">
                          {getInitials(user?.ds_nome)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.ds_nome}</p>
                    <p className="text-xs text-slate-500">{user?.ds_email}</p>
                    {user?.nu_telefone && (
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" /> {formatPhone(user.nu_telefone)}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/configuracoes" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* AQUI ESTÁ A CORREÇÃO: Utilizando o componente Link do Inertia como botão */}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/logout"
                      method="post"
                      as="button"
                      className="w-full text-left text-rose-600 cursor-pointer flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <motion.div
            key={url}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Modal de Troca de Senha Obrigatória */}
      <Dialog open={showPassModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Shield className="w-5 h-5" />
              Segurança da Conta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-center sm:text-left">
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-xl">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                Detectamos que este é o seu primeiro acesso com a senha padrão.
              </p>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Por motivos de segurança, você deve **alterar sua senha** antes de continuar utilizando o sistema.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 h-11 rounded-xl">
              <Link href="/configuracoes">
                <Settings className="w-4 h-4 mr-2" />
                Ir para Configurações agora
              </Link>
            </Button>
            <p className="text-[10px] text-center text-slate-400">
              Você não terá acesso total ao sistema até concluir esta etapa.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <TechChat />
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </ThemeProvider>
  );
}