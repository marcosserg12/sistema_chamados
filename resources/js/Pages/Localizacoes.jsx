import React, { useState, useEffect, useRef } from "react";
import { Head, router, useForm, Link } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Badge } from "@/Components/ui/badge";
import { Checkbox } from "@/Components/ui/checkbox"; // Certifique-se de ter este componente ou use o input nativo abaixo
import {
  Plus,
  Search,
  MapPin,
  Building2,
  Loader2,
  Edit,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Localizacoes({ localizacoes, empresasDisponiveis, filters }) {
  const [search, setSearch] = useState(filters?.search || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const isFirstRender = useRef(true);

  const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
    nome: "",
    empresas: [], // Array de IDs
  });

  // Debounce da Pesquisa
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      router.get('/localizacoes', { search }, { preserveState: true, preserveScroll: true, replace: true });
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // AÇÕES
  const handleOpenCreate = () => {
    setEditingId(null);
    clearErrors();
    reset();
    // Se quiser que venha algo pré-selecionado, configure aqui
    setData({ nome: "", empresas: [] });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingId(loc.id);
    clearErrors();
    setData({
      nome: loc.nome || "",
      empresas: loc.empresas_ids || [],
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
      put(`/localizacoes/${editingId}`, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset();
          toast.success("Localização atualizada com sucesso!");
        },
        onError: () => toast.error("Verifique os campos.")
      });
    } else {
      post('/localizacoes', {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset();
          toast.success("Localização criada com sucesso!");
        },
        onError: () => toast.error("Verifique os campos.")
      });
    }
  };

  const handleToggleStatus = (loc) => {
    router.put(`/localizacoes/${loc.id}/toggle-status`, {}, {
        preserveScroll: true,
        onSuccess: () => toast.success(`Status alterado com sucesso!`)
    });
  };

  // Função para lidar com a seleção múltipla de empresas
  const toggleEmpresa = (idEmpresa) => {
    const id = String(idEmpresa);
    const current = [...data.empresas];
    if (current.includes(id)) {
        setData('empresas', current.filter(item => item !== id));
    } else {
        setData('empresas', [...current, id]);
    }
  };

  const listaLocalizacoes = localizacoes.data || [];

  return (
    <AppLayout>
      <Head title="Localizações" />

      <div className="max-w-[1400px] mx-auto pb-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Localizações</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
                Gerencie os locais físicos (salas, setores) do sistema
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Localização
          </Button>
        </div>

        {/* MODAL CRIAR / EDITAR */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-800/95 border-slate-200 dark:border-slate-700/50 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingId ? "Editar Localização" : "Nova Localização"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-2">

              {/* NOME DA LOCALIZAÇÃO */}
              <div className="space-y-2">
                <Label className={cn("text-xs font-bold uppercase", errors.nome ? "text-rose-500" : "text-slate-500 dark:text-slate-400")}>
                    Nome do Local *
                </Label>
                <Input
                  value={data.nome}
                  onChange={e => setData("nome", e.target.value)}
                  className={cn(
                    "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 dark:text-slate-100",
                    errors.nome && "border-rose-500 focus-visible:ring-rose-500 bg-rose-50/50 dark:bg-rose-900/20"
                  )}
                  placeholder="Ex: Recepção Térreo, Sala 104..."
                />
                {errors.nome && <p className="text-rose-500 text-[11px] font-bold mt-1">{errors.nome}</p>}
              </div>

              {/* SELEÇÃO DE EMPRESAS (CHECKLIST) */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Vincular a Empresas *
                </Label>
                <div className="border border-slate-200 dark:border-slate-700/50 rounded-lg max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-900/30 p-1">
                    {empresasDisponiveis.length === 0 ? (
                        <p className="p-3 text-sm text-slate-400 text-center">Nenhuma empresa cadastrada.</p>
                    ) : (
                        empresasDisponiveis.map((emp) => {
                            const isSelected = data.empresas.includes(String(emp.id_empresa));
                            return (
                                <div
                                    key={emp.id_empresa}
                                    onClick={() => toggleEmpresa(emp.id_empresa)}
                                    className={cn(
                                        "flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors text-sm",
                                        isSelected
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                        isSelected
                                            ? "bg-indigo-600 border-indigo-600"
                                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    )}>
                                        {isSelected && <Plus className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium">{emp.ds_empresa}</span>
                                </div>
                            );
                        })
                    )}
                </div>
                {errors.empresas && <p className="text-rose-500 text-[11px] font-bold mt-1">{errors.empresas}</p>}
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Selecione quais empresas podem visualizar este local.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" disabled={processing}>
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (editingId ? "Salvar Alterações" : "Salvar Localização")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ================= BARRA DE PESQUISA E LISTAGEM ================= */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-lg overflow-hidden flex flex-col backdrop-blur-sm">

          {/* SEARCH */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Buscar localização..."
                className="pl-9 h-9 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-[13px] dark:text-slate-300 dark:placeholder-slate-500 focus-visible:ring-indigo-500 shadow-none hover:dark:border-slate-600 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/80">
                <tr>
                  <th className="px-5 py-3">LOCALIZAÇÃO</th>
                  <th className="px-5 py-3">EMPRESAS VINCULADAS</th>
                  <th className="px-5 py-3 text-center">STATUS</th>
                  <th className="px-5 py-3 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300">
                {listaLocalizacoes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      Nenhuma localização encontrada.
                    </td>
                  </tr>
                ) : (
                  listaLocalizacoes.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">

                      {/* Nome */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 border border-transparent dark:border-emerald-500/20">
                            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {loc.nome}
                          </span>
                        </div>
                      </td>

                      {/* Empresas Vinculadas */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 max-w-[400px] truncate">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="text-slate-500 dark:text-slate-400 truncate" title={loc.empresas_nomes}>
                                {loc.empresas_nomes || "Nenhuma vinculada"}
                            </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase",
                          loc.ativo
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-300 dark:border dark:border-slate-600/50"
                        )}>
                          {loc.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(loc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-transparent rounded-md hover:bg-indigo-50 dark:hover:bg-slate-700/50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(loc)}
                            className={cn(
                              "p-1.5 rounded-md transition-colors",
                              loc.ativo
                                ? "text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700/50"
                                : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700/50"
                            )}
                            title={loc.ativo ? "Desativar" : "Ativar"}
                          >
                            {loc.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ E PAGINAÇÃO */}
          {localizacoes?.links?.length > 3 && (
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Mostrando {localizacoes.from || 0} até {localizacoes.to || 0} de {localizacoes.total || 0}
              </div>

              <div className="flex items-center gap-2">
                {localizacoes.links.map((link, index) => {
                  const isPrevious = index === 0;
                  const isNext = index === localizacoes.links.length - 1;

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
                          ? "bg-[#6d28d9] text-white shadow-md shadow-indigo-500/20 dark:bg-indigo-600 ring-2 ring-indigo-500/10"
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