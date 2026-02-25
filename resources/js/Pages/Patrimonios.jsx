import React, { useState, useEffect, useRef } from "react";
import { Head, router, useForm, Link } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Plus, Search, Building2, Loader2, Package, Tag, Layers, Edit, PenLine, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Patrimonios({ patrimonios, tipos, empresas, filters }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // <--- Estado para controle de edição
  const [search, setSearch] = useState(filters.search || "");
  const isFirstRender = useRef(true);

  // Adicionei o 'put' aqui
  const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
    ds_codigo: "",
    id_tipo_produto: "",
    ds_marca: "",
    ds_modelo: "",
    ds_num_serie: "",
    id_empresa: "",
  });

  // Auto-seleção de empresa (apenas na criação)
  useEffect(() => {
    if (empresas?.length === 1 && !data.id_empresa && !editingId) {
      setData("id_empresa", String(empresas[0].id_empresa));
    }
  }, [empresas, isDialogOpen]);

  // Debounce Search
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const delay = setTimeout(() => {
      router.get('/patrimonios', { search }, { preserveState: true, preserveScroll: true, replace: true });
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  // Lógica para abrir modal de edição via URL (?edit=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId && patrimonios.data.length > 0) {
      const item = patrimonios.data.find(p => String(p.id_patrimonio) === String(editId));
      if (item) {
        handleOpenEdit(item);
        // Opcional: Limpar o parâmetro da URL para não reabrir ao atualizar
        // window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [patrimonios.data]);

  // ABRIR PARA CRIAR
  const handleOpenCreate = () => {
    setEditingId(null);
    clearErrors();
    reset();
    if (empresas?.length === 1) {
        setData("id_empresa", String(empresas[0].id_empresa));
    }
    setIsDialogOpen(true);
  };

  // ABRIR PARA EDITAR
  const handleOpenEdit = (item) => {
    setEditingId(item.id_patrimonio);
    clearErrors();
    setData({
        ds_codigo: item.ds_codigo || "",
        id_tipo_produto: String(item.id_tipo_produto),
        ds_marca: item.ds_marca || "",
        ds_modelo: item.ds_modelo || "",
        ds_num_serie: item.ds_num_serie || "",
        id_empresa: String(item.id_empresa),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
        // MODO EDIÇÃO
        put(`/patrimonios/${editingId}`, {
            onSuccess: () => {
              setIsDialogOpen(false);
              reset();
              toast.success("Patrimônio atualizado com sucesso!");
            },
            onError: () => toast.error("Verifique os erros no formulário.")
        });
    } else {
        // MODO CRIAÇÃO
        post('/patrimonios', {
            onSuccess: () => {
              setIsDialogOpen(false);
              reset();
              toast.success("Patrimônio registrado com sucesso!");
            },
            onError: () => toast.error("Verifique os campos obrigatórios.")
        });
    }
  };

  return (
    <AppLayout>
      <Head title="Patrimônios" />
      <div className="max-w-[1400px] mx-auto pb-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Patrimônios</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Gestão de hardware e ativos tecnológicos</p>
          </div>
          <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Novo Ativo
          </Button>
        </div>

        {/* BUSCA */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por tag, marca ou modelo..."
            className="pl-10 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* LISTAGEM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patrimonios.data.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">Nenhum ativo encontrado.</div>
          ) : (
            patrimonios.data.map((p) => (
              <Card key={p.id_patrimonio} className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-all backdrop-blur-sm group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                        <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                          {p.ds_marca} {p.ds_modelo}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <Tag className="w-3 h-3" /> <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{p.ds_codigo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500">
                        {p.tipo?.ds_produto || "Geral"}
                        </Badge>
                        {/* BOTÃO EDITAR */}
                        <button
                            onClick={() => handleOpenEdit(p)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
                            title="Editar Ativo"
                        >
                            <PenLine className="w-4 h-4" />
                        </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {p.empresa?.ds_empresa || "Sem empresa"}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      S/N: {p.ds_num_serie || "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* RODAPÉ E PAGINAÇÃO */}
        {patrimonios?.links?.length > 3 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700/50">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Mostrando {patrimonios.from || 0} até {patrimonios.to || 0} de {patrimonios.total || 0}
            </div>

            <div className="flex items-center gap-2">
              {patrimonios.links.map((link, index) => {
                const isPrevious = index === 0;
                const isNext = index === patrimonios.links.length - 1;

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

        {/* MODAL (SERVE PARA CRIAR E EDITAR) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-800/95 border-slate-200 dark:border-slate-700/50 backdrop-blur-md">
            <DialogHeader>
                <DialogTitle>
                    {editingId ? "Editar Patrimônio" : "Cadastrar Novo Patrimônio"}
                </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Tag / Patrimônio *</Label>
                  <Input value={data.ds_codigo} onChange={e => setData("ds_codigo", e.target.value)} className={cn(errors.ds_codigo && "border-rose-500 bg-rose-50/50")} />
                  {errors.ds_codigo && <p className="text-rose-500 text-[10px] font-bold">{errors.ds_codigo}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Tipo de Produto *</Label>
                  <Select value={data.id_tipo_produto} onValueChange={v => setData("id_tipo_produto", v)}>
                    <SelectTrigger className={cn(errors.id_tipo_produto && "border-rose-500")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800">{tipos?.map(t => <SelectItem key={t.id_tipo_produto} value={String(t.id_tipo_produto)}>{t.ds_produto}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Marca</Label><Input value={data.ds_marca} onChange={e => setData("ds_marca", e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Modelo</Label><Input value={data.ds_modelo} onChange={e => setData("ds_modelo", e.target.value)} /></div>
              </div>

              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Número de Série</Label><Input value={data.ds_num_serie} onChange={e => setData("ds_num_serie", e.target.value)} /></div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Empresa Proprietária *</Label>
                <Select value={data.id_empresa} onValueChange={v => setData("id_empresa", v)} disabled={empresas?.length === 1}>
                  <SelectTrigger className={cn(errors.id_empresa && "border-rose-500")}><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                  <SelectContent className="dark:bg-slate-800">{empresas?.map(emp => <SelectItem key={emp.id_empresa} value={String(emp.id_empresa)}>{emp.ds_empresa}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="dark:text-slate-300">Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold" disabled={processing}>
                  {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : (editingId ? "Salvar Alterações" : "Salvar Patrimônio")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}