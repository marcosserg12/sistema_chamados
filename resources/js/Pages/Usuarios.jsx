import React, { useState, useEffect, useRef } from "react";
import { Head, router, useForm, usePage, Link } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Certifique-se de ter este componente ou use o input nativo
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Mail,
  ShieldCheck,
  Wrench,
  UserCircle,
  Loader2,
  Copy,
  Check,
  Edit,
  Star,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Usuarios({ usuarios, perfis, empresas = [], filters }) {
  const { flash } = usePage().props;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState(filters?.search || "");
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const isFirstRender = useRef(true);

  // Agora usamos Arrays para empresas e localizações
  const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
    name: "",
    email: "",
    login: "",
    phone: "",
    role: "",
    empresas: [],     // Array de IDs ['1', '2']
    localizacoes: [], // Array de IDs ['10', '11']
  });

  // =========================================================================
  // LÓGICA DE CHECKBOXES (EMPRESAS E LOCAIS)
  // =========================================================================

  // Alternar Empresa
  const toggleEmpresa = (idEmpresa) => {
    const id = String(idEmpresa);
    const current = [...data.empresas];

    if (current.includes(id)) {
        // Se desmarcar empresa, removemos ela e suas localizações da seleção
        const newEmpresas = current.filter(item => item !== id);

        // Encontra as localizações desta empresa para remover
        const empresaObj = empresas.find(e => String(e.id_empresa) === id);
        const locaisIdsParaRemover = empresaObj ? empresaObj.localizacoes.map(l => String(l.id_localizacao)) : [];
        const newLocalizacoes = data.localizacoes.filter(locId => !locaisIdsParaRemover.includes(locId));

        setData(data => ({ ...data, empresas: newEmpresas, localizacoes: newLocalizacoes }));
    } else {
        // Se marcar, apenas adiciona a empresa
        setData("empresas", [...current, id]);
    }
  };

  // Alternar Localização
  const toggleLocalizacao = (idLocalizacao) => {
    const id = String(idLocalizacao);
    const current = [...data.localizacoes];
    if (current.includes(id)) {
        setData("localizacoes", current.filter(item => item !== id));
    } else {
        setData("localizacoes", [...current, id]);
    }
  };

  // Marcar/Desmarcar todas as localizações de uma empresa
  const toggleAllLocais = (empresaId, locaisDaEmpresa) => {
    const idsLocais = locaisDaEmpresa.map(l => String(l.id_localizacao));
    const todosMarcados = idsLocais.every(id => data.localizacoes.includes(id));

    let newLocais = [...data.localizacoes];

    if (todosMarcados) {
        // Desmarcar todos desta empresa
        newLocais = newLocais.filter(id => !idsLocais.includes(id));
    } else {
        // Marcar todos (adicionar os que faltam)
        idsLocais.forEach(id => {
            if (!newLocais.includes(id)) newLocais.push(id);
        });
    }
    setData("localizacoes", newLocais);
  };

  // =========================================================================
  // OUTRAS FUNÇÕES
  // =========================================================================

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    if (value.length <= 15) setData("phone", value);
  };

  useEffect(() => {
    if (flash?.success_password) {
      setGeneratedPassword(flash.success_password);
      setIsDialogOpen(false);
      reset();
    }
  }, [flash]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      router.get('/usuarios', { search }, { preserveState: true, preserveScroll: true, replace: true });
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Lógica para abrir modal de edição via URL (?edit=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId && usuarios.data.length > 0) {
      const usuario = usuarios.data.find(u => String(u.id) === String(editId));
      if (usuario) {
        handleOpenEdit(usuario);
      }
    }
  }, [usuarios.data]);

  const handleOpenCreate = () => {
    setEditingId(null);
    clearErrors();
    reset();
    // Se só tem 1 empresa disponível, já marca ela
    if (empresas?.length === 1) {
        setData(d => ({ ...d, empresas: [String(empresas[0].id_empresa)] }));
    }
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (usuario) => {
    setEditingId(usuario.id);
    clearErrors();
    setData({
      name: usuario.name || "",
      email: usuario.email || "",
      login: usuario.login || "",
      phone: usuario.phone || "",
      role: String(usuario.role_id),
      empresas: usuario.empresas_ids || [],
      localizacoes: usuario.localizacoes_ids || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.empresas.length === 0) {
        toast.error("Selecione pelo menos uma empresa vinculada.");
        return;
    }

    if (editingId) {
      put(`/usuarios/${editingId}`, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset();
          toast.success("Usuário atualizado com sucesso!");
        },
        onError: () => toast.error("Verifique os erros no formulário.")
      });
    } else {
      post('/usuarios', {
        onError: () => toast.error("Verifique os erros no formulário.")
      });
    }
  };

const getRoleStyle = (roleId) => {
    switch (Number(roleId)) {
      case 5: return { icon: ShieldCheck, color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30" };
      case 1: return { icon: ShieldCheck, color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30" };
      case 3: return { icon: ShieldCheck, color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30" };
      case 4: return { icon: Wrench, color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30" };
      default: return { icon: UserCircle, color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" };
    }
  };

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "US";
  const copyToClipboard = () => { navigator.clipboard.writeText(generatedPassword); toast.success("Copiado!"); setGeneratedPassword(null); };
  const usuariosList = usuarios?.data || [];

  return (
    <AppLayout>
      <Head title="Usuários" />
      <div className="max-w-[1400px] mx-auto pb-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Usuários & Equipe</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Gerencie permissões e acessos ao sistema</p>
          </div>
          <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>

        {/* MODAL SENHA GERADA */}
        <Dialog open={!!generatedPassword} onOpenChange={(open) => !open && setGeneratedPassword(null)}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><Check className="w-5 h-5" /> Usuário Criado!</DialogTitle>
              <DialogDescription className="pt-2 text-slate-600 dark:text-slate-300">Senha provisória gerada.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <code className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">{generatedPassword}</code>
              <Button size="sm" variant="ghost" onClick={copyToClipboard}><Copy className="w-4 h-4 text-slate-500" /></Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL CADASTRO / EDIÇÃO GRANDE */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800/95 border-slate-200 dark:border-slate-700/50 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingId ? "Editar Usuário" : "Adicionar Novo Membro"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4" noValidate>

              {/* DADOS PESSOAIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("text-xs font-bold uppercase", errors.name ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>Nome *</Label>
                    <Input value={data.name} onChange={e => setData("name", e.target.value)} className={cn("bg-slate-50 dark:bg-slate-900/50 dark:text-slate-100", errors.name && "border-rose-500")} />
                    {errors.name && <p className="text-rose-500 text-[10px] font-bold">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label className={cn("text-xs font-bold uppercase", errors.login ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>Login *</Label>
                    <Input value={data.login} onChange={e => setData("login", e.target.value)} className={cn("bg-slate-50 dark:bg-slate-900/50 dark:text-slate-100", errors.login && "border-rose-500")} />
                    {errors.login && <p className="text-rose-500 text-[10px] font-bold">{errors.login}</p>}
                </div>
                <div className="space-y-2">
                    <Label className={cn("text-xs font-bold uppercase", errors.email ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>Email *</Label>
                    <Input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className={cn("bg-slate-50 dark:bg-slate-900/50 dark:text-slate-100", errors.email && "border-rose-500")} />
                    {errors.email && <p className="text-rose-500 text-[10px] font-bold">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Telefone</Label>
                    <Input value={data.phone} onChange={handlePhoneChange} className="bg-slate-50 dark:bg-slate-900/50 dark:text-slate-100" maxLength={15} />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label className={cn("text-xs font-bold uppercase", errors.role ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>Perfil *</Label>
                    <Select value={data.role} onValueChange={v => setData("role", v)}>
                        <SelectTrigger className={cn("bg-slate-50 dark:bg-slate-900/50 dark:text-slate-100", errors.role && "border-rose-500")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className="dark:bg-slate-800">
                            {perfis.map((p) => <SelectItem key={p.id_perfil} value={String(p.id_perfil)}>{p.ds_perfil}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {errors.role && <p className="text-rose-500 text-[10px] font-bold">{errors.role}</p>}
                </div>
              </div>

              {/* SEÇÃO 1: EMPRESAS VINCULADAS (IGUAL A FOTO) */}
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Empresas Vinculadas</Label>
                <div className="flex flex-wrap gap-4">
                    {empresas?.map((emp) => (
                        <div key={emp.id_empresa} className="flex items-center space-x-2">
                            {/* Input Nativo Customizado para evitar erro de componente */}
                            <input
                                type="checkbox"
                                id={`emp-${emp.id_empresa}`}
                                checked={data.empresas.includes(String(emp.id_empresa))}
                                onChange={() => toggleEmpresa(emp.id_empresa)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                            />
                            <label htmlFor={`emp-${emp.id_empresa}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                {emp.ds_empresa}
                            </label>
                        </div>
                    ))}
                </div>
                {errors.empresas && <p className="text-rose-500 text-[10px] font-bold">{errors.empresas}</p>}
              </div>

              {/* SEÇÃO 2: LOCALIZAÇÕES VINCULADAS (AGRUPADAS POR EMPRESA SELECIONADA) */}
              {data.empresas.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Localizações Vinculadas</Label>

                    {empresas
                        .filter(emp => data.empresas.includes(String(emp.id_empresa))) // Mostra apenas empresas selecionadas
                        .map(emp => (
                            <div key={emp.id_empresa} className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-indigo-500" />
                                        {emp.ds_empresa}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => toggleAllLocais(emp.id_empresa, emp.localizacoes)}
                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                                    >
                                        Marcar todos
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 border-l-2 border-slate-100 dark:border-slate-700">
                                    {emp.localizacoes && emp.localizacoes.length > 0 ? (
                                        emp.localizacoes.map(loc => (
                                            <div key={loc.id_localizacao} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`loc-${loc.id_localizacao}`}
                                                    checked={data.localizacoes.includes(String(loc.id_localizacao))}
                                                    onChange={() => toggleLocalizacao(loc.id_localizacao)}
                                                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                                                />
                                                <label htmlFor={`loc-${loc.id_localizacao}`} className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer truncate" title={loc.ds_localizacao}>
                                                    {loc.ds_localizacao}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Nenhuma localização ativa.</p>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                  </div>
              )}

              {!editingId && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 text-xs text-blue-700 dark:text-blue-300">
                  ℹ️ Uma senha será gerada automaticamente e exibida após salvar.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="dark:text-slate-300 dark:border-slate-600">Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" disabled={processing}>
                  {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : (editingId ? "Salvar Alterações" : "Gerar Usuário")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ... (O RESTANTE DA TELA - FILTRO E GRID - PERMANECE IGUAL AO ANTERIOR) ... */}
        {/* FILTRO */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              className="pl-10 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-sm shadow-sm rounded-lg hover:dark:border-slate-600 transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* GRID DE USUÁRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {usuariosList.length === 0 ? (
             <div className="col-span-full text-center py-12 text-slate-400 font-medium">Nenhum usuário encontrado.</div>
          ) : (
            usuariosList.map((usuario) => {
              const { icon: RoleIcon, color } = getRoleStyle(usuario.role_id, usuario.role_name);

              return (
                <Card key={usuario.id} className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-all group backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-white dark:border-slate-600 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-200 font-bold">
                            {getInitials(usuario.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[140px]" title={usuario.name}>
                            {usuario.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[130px]" title={usuario.email}>{usuario.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={cn("text-[10px] uppercase font-extrabold shadow-none", color)}>
                            <RoleIcon className="w-3 h-3 mr-1" /> {usuario.role_name}
                        </Badge>
                        <button
                            onClick={() => handleOpenEdit(usuario)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Editar Usuário"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/30">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Login</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate px-1" title={usuario.login}>
                            {usuario.login || "-"}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/30">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Telefone</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate px-1">
                            {usuario.phone || "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* PAGINAÇÃO */}
        {usuarios?.links?.length > 3 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Mostrando {usuarios.from || 0} até {usuarios.to || 0} de {usuarios.total || 0}
            </div>

            <div className="flex items-center gap-2">
              {usuarios.links.map((link, index) => {
                const isPrevious = index === 0;
                const isNext = index === usuarios.links.length - 1;

                if (isPrevious) {
                  return (
                    <Link
                      key={index}
                      href={link.url || "#"}
                      className={cn(
                        "flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-md transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider shadow-sm whitespace-nowrap",
                        !link.url && "opacity-40 pointer-events-none grayscale"
                      )}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                      <span>Anterior</span>
                    </Link>
                  );
                }

                if (isNext) {
                  return (
                    <Link
                      key={index}
                      href={link.url || "#"}
                      className={cn(
                        "flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-md transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider shadow-sm whitespace-nowrap",
                        !link.url && "opacity-40 pointer-events-none grayscale"
                      )}
                    >
                      <span>Próximo</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={index}
                    href={link.url || "#"}
                                          className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-md transition-all font-bold text-xs",
                                            link.active
                                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/10"
                                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400",
                                            !link.url && "pointer-events-none text-slate-300 dark:text-slate-700"
                                          )}
                    
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}