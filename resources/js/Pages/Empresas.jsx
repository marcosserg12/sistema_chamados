import React, { useState, useEffect, useRef } from "react";
import { Link, Head, router, useForm } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Building2,
  Loader2,
  Mail,
  Phone,
  Edit,
  Power,
  PowerOff,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Empresas({ empresas, filters }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const isFirstRender = useRef(true);

  // =========================================================================
  // HOOK DO INERTIA PARA O FORMULÁRIO
  // =========================================================================
  const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    responsavel: "",
  });

  // =========================================================================
  // PESQUISA EM TEMPO REAL (DEBOUNCE)
  // =========================================================================
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      router.get('/empresas', { search }, { preserveState: true, preserveScroll: true, replace: true });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // =========================================================================
  // AÇÕES DO CRUD
  // =========================================================================

  const handleOpenCreate = () => {
    setEditingId(null);
    clearErrors();
    reset();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (empresa) => {
    setEditingId(empresa.id_empresa);
    clearErrors();
    setData({
      nome: empresa.nome || "",
      cnpj: empresa.cnpj || "",
      endereco: empresa.endereco || "",
      telefone: empresa.telefone || "",
      email: empresa.email || "",
      responsavel: empresa.responsavel || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      put(`/empresas/${editingId}`, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset();
          toast.success("Empresa atualizada com sucesso!");
        },
      });
    } else {
      post('/empresas', {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset();
          toast.success("Empresa cadastrada com sucesso!");
        },
      });
    }
  };

  const handleToggleStatus = (empresa) => {
    const acao = empresa.ativo ? "desativar" : "ativar";

    toast(`Deseja realmente ${acao} esta empresa?`, {
      action: {
        label: 'Sim, confirmar',
        onClick: () => {
          router.put(`/empresas/${empresa.id_empresa}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Empresa ${empresa.ativo ? 'desativada' : 'ativada'} com sucesso!`)
          });
        }
      },
    });
  };

  const empresasList = Array.isArray(empresas) ? empresas : (empresas?.data || []);

  return (
    <AppLayout>
      <Head title="Empresas" />

      <div className="max-w-[1400px] mx-auto pb-6">

        {/* ================= CABEÇALHO ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Empresas</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Gestão de clientes MS Soluções</p>
          </div>

          <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Nova Empresa
          </Button>
        </div>

        {/* ================= MODAL CADASTRAR/EDITAR (Modo Escuro Premium) ================= */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-800/95 border-slate-200 dark:border-slate-700/50 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingId ? "Editar Empresa" : "Cadastrar Empresa"}
              </DialogTitle>
            </DialogHeader>

            {/* O onSubmit aqui comanda os avisos de "required" nos inputs */}
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Razão Social *</Label>
                <Input
                  value={data.nome}
                  onChange={(e) => setData("nome", e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 dark:text-slate-100 dark:placeholder-slate-500 focus-visible:ring-indigo-500/50"
                  required // <-- Isto faz o navegador exigir o preenchimento!
                  placeholder="Nome da empresa"
                />
                {errors.nome && <p className="text-rose-500 text-xs font-bold">{errors.nome}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={data.cnpj}
                    onChange={(e) => setData("cnpj", e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 dark:text-slate-100 dark:placeholder-slate-500 focus-visible:ring-indigo-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Responsável</Label>
                  <Input
                    value={data.responsavel}
                    onChange={(e) => setData("responsavel", e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 dark:text-slate-100 dark:placeholder-slate-500 focus-visible:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Endereço Completo</Label>
                <Input
                  value={data.endereco}
                  onChange={(e) => setData("endereco", e.target.value)}
                  placeholder="Ex: Rua das Flores, 123, Centro, Cidade - UF"
                  className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 dark:text-slate-100 dark:placeholder-slate-500 focus-visible:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">E-mail de Contato</Label>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 dark:text-slate-100 dark:placeholder-slate-500 focus-visible:ring-indigo-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Telefone</Label>
                  <Input
                    value={data.telefone}
                    onChange={(e) => setData("telefone", e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 dark:text-slate-100 dark:placeholder-slate-500 focus-visible:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-slate-600 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700/50"
                >
                  Cancelar
                </Button>
                {/* O type="submit" garante que o form verifique os campos "required" */}
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingId ? "Salvar Alterações" : "Cadastrar Empresa"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================= BARRA DE PESQUISA E TABELA ================= */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-lg overflow-hidden flex flex-col backdrop-blur-sm">

          <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                className="pl-9 h-9 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-[13px] dark:text-slate-300 dark:placeholder-slate-500 focus-visible:ring-indigo-500 shadow-none hover:dark:border-slate-600 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/80">
                <tr>
                  <th className="px-5 py-3">EMPRESA</th>
                  <th className="px-5 py-3">CNPJ</th>
                  <th className="px-5 py-3">ENDEREÇO</th>
                  <th className="px-5 py-3">CONTATOS</th>
                  <th className="px-5 py-3 text-center">STATUS</th>
                  <th className="px-5 py-3 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300">
                {empresasList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                ) : (
                  empresasList.map((empresa) => {
                    return (
                      <tr key={empresa.id_empresa} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">

                        {/* Nome e Responsável */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 border border-transparent dark:border-indigo-500/20">
                              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex flex-col max-w-[200px] truncate">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate" title={empresa.nome}>
                                {empresa.nome}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {empresa.responsavel ? `Resp: ${empresa.responsavel}` : "Sem responsável"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CNPJ */}
                        <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {empresa.cnpj || "-"}
                        </td>

                        {/* Endereço */}
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={empresa.endereco}>
                          {empresa.endereco ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span className="truncate">{empresa.endereco}</span>
                            </div>
                          ) : "-"}
                        </td>

                        {/* Contatos */}
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1 text-[11px]">
                            {empresa.email && (
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <Mail className="w-3 h-3" /> <span className="truncate max-w-[120px]">{empresa.email}</span>
                              </div>
                            )}
                            {empresa.telefone && (
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <Phone className="w-3 h-3" /> <span>{empresa.telefone}</span>
                              </div>
                            )}
                            {!empresa.email && !empresa.telefone && <span>-</span>}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide",
                            empresa.ativo
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-300 dark:border dark:border-slate-600/50"
                          )}>
                            {empresa.ativo ? "ATIVO" : "INATIVO"}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(empresa)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-transparent rounded-md hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                              title="Editar Empresa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(empresa)}
                              className={cn(
                                "p-1.5 rounded-md transition-colors",
                                empresa.ativo
                                  ? "text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700/50"
                                  : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700/50"
                              )}
                              title={empresa.ativo ? "Desativar Empresa" : "Ativar Empresa"}
                            >
                              {empresa.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ E PAGINAÇÃO */}
          {empresas?.links?.length > 3 && (
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Mostrando {empresas.from || 0} até {empresas.to || 0} de {empresas.total || 0}
              </div>

              <div className="flex items-center gap-2">
                {empresas.links.map((link, index) => {
                  const isPrevious = index === 0;
                  const isNext = index === empresas.links.length - 1;

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
      </div>
    </AppLayout>
  );
}