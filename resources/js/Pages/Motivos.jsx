import React, { useState, useMemo, useEffect } from "react";
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Settings, ListTree, Layers, FileText, Search, Power, CheckCircle2, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@inertiajs/react";
import Swal from 'sweetalert2';

// Helper para juntar classes
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Motivos({ tipos, motivos, associados, empresas }) {
    const { flash } = usePage().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [activeTab, setActiveTab] = useState("tipos");
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Paginação Frontend
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Reset da página ao trocar tab ou buscar
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    // --- SWEETALERT (Mensagens de Sucesso) ---
    useEffect(() => {
        if (flash?.message) {
            Swal.fire({
                title: 'Sucesso!',
                text: flash.message,
                icon: 'success',
                confirmButtonColor: '#4f46e5',
                background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
            });
        }
        if (flash?.error) {
            Swal.fire({
                title: 'Atenção!',
                text: flash.error,
                icon: 'error',
                confirmButtonColor: '#e11d48',
            });
        }
    }, [flash]);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        ds_tipo_chamado: "",
        id_tipo_chamado: "",
        ds_descricao: "",
        id_motivo_principal: "",
        ds_descricao_motivo: "",
        id_empresa: "null",
        st_ativo: "A"
    });

    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (activeTab === "tipos") {
            return tipos.filter(i => i.ds_tipo_chamado.toLowerCase().includes(term));
        } else if (activeTab === "motivos") {
            return motivos.filter(i => i.ds_descricao.toLowerCase().includes(term) || i.tipo?.ds_tipo_chamado.toLowerCase().includes(term));
        } else {
            return associados.filter(i => i.ds_descricao_motivo.toLowerCase().includes(term) || i.motivo_principal?.ds_descricao.toLowerCase().includes(term));
        }
    }, [searchTerm, activeTab, tipos, motivos, associados]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage]);

    const openModal = (item = null) => {
        clearErrors();
        setEditingItem(item);
        if (item) {
            setData({
                ds_tipo_chamado: item.ds_tipo_chamado || "",
                ds_descricao: item.ds_descricao || "",
                id_tipo_chamado: item.id_tipo_chamado ? String(item.id_tipo_chamado) : "",
                ds_descricao_motivo: item.ds_descricao_motivo || "",
                id_motivo_principal: item.id_motivo_principal ? String(item.id_motivo_principal) : "",
                id_empresa: item.id_empresa ? String(item.id_empresa) : "null",
                st_ativo: item.st_ativo || "A"
            });
        } else {
            reset();
            setData('id_empresa', 'null');
        }
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Limpamos erros antes de enviar
        clearErrors();

        let url = "";
        const options = {
            onSuccess: () => {
                setModalOpen(false);
                reset();
            },
            onError: () => {
                // Mantém o modal aberto para mostrar os campos vermelhos
            }
        };

        if (activeTab === "tipos") {
            url = editingItem ? `/configuracao/tipos/${editingItem.id_tipo_chamado}` : '/configuracao/tipos';
        } else if (activeTab === "motivos") {
            url = editingItem ? `/configuracao/motivos/${editingItem.id_motivo_principal}` : '/configuracao/motivos';
        } else {
            url = editingItem ? `/configuracao/associados/${editingItem.id_motivo_associado}` : '/configuracao/associados';
        }

        const payload = { ...data, id_empresa: data.id_empresa === "null" ? null : data.id_empresa };

        if (editingItem) {
            router.post(url, { ...payload, _method: 'put' }, options);
        } else {
            post(url, options);
        }
    };

    const handleToggleStatus = (item, idKey) => {
        setPendingAction({ item, idKey });
        setConfirmOpen(true);
    };

    const confirmToggleStatus = () => {
        if (!pendingAction) return;

        const { item, idKey } = pendingAction;
        const novoStatus = item.st_ativo === 'A' ? 'I' : 'A';

        let url = "";
        if (activeTab === "tipos") url = `/configuracao/tipos/${item[idKey]}`;
        else if (activeTab === "motivos") url = `/configuracao/motivos/${item[idKey]}`;
        else url = `/configuracao/associados/${item[idKey]}`;

        router.post(url, {
            _method: 'put',
            st_ativo: novoStatus
        }, {
            onSuccess: () => {
                setConfirmOpen(false);
                setPendingAction(null);
            },
            onError: () => {
                setConfirmOpen(false);
                Swal.fire('Erro', 'Não foi possível alterar o status.', 'error');
            }
        });
    };

    // =========================================================================
    // ESTILOS VISUAIS (IGUAL AO NOVO CHAMADO)
    // =========================================================================

    // Função mágica que aplica o estilo "Red Tint" do print quando tem erro
    const getInputClass = (hasError) => cn(
        "h-12 font-semibold shadow-sm transition-all",
        hasError
            ? "!border-red-500 !ring-red-500/20 bg-red-50 dark:!bg-red-500/10 focus-visible:!ring-red-500 text-red-900 dark:text-red-100 placeholder:text-red-400"
            : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus-visible:ring-indigo-500"
    );

    // Estilo do Label (Uppercase e bold)
    const labelClass = "text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block";

    // Mensagem de Erro com Ícone
    const ErrorMessage = ({ message }) => (
        message ? (
            <span className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {message}
            </span>
        ) : null
    );

    return (
        <AppLayout>
            <Head title="Configuração de Motivos" />
            <div className="max-w-[1200px] mx-auto p-6 space-y-6">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            Catálogo de Motivos
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie a hierarquia de classificação.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Filtrar resultados..."
                                className="pl-9 w-[250px] dark:bg-slate-800 dark:border-slate-700 dark:text-white h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 shadow-md shadow-indigo-200 dark:shadow-none">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar
                        </Button>
                    </div>
                </div>

                {/* TABS */}
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchTerm(""); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800">
                        <TabsTrigger value="tipos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-200">
                            <Layers className="w-4 h-4 mr-2" /> Tipos
                        </TabsTrigger>
                        <TabsTrigger value="motivos" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-200">
                            <ListTree className="w-4 h-4 mr-2" /> Motivos
                        </TabsTrigger>
                        <TabsTrigger value="associados" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-200">
                            <FileText className="w-4 h-4 mr-2" /> Detalhes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-sm border-slate-200">
                            <CardContent className="p-0">
                                {activeTab === "tipos" && (
                                    <TableList
                                        data={paginatedData}
                                        columns={[{ label: 'Descrição do Tipo', key: 'ds_tipo_chamado' }]}
                                        onEdit={openModal}
                                        onToggle={(item) => handleToggleStatus(item, 'id_tipo_chamado')}
                                    />
                                )}
                                {activeTab === "motivos" && (
                                    <TableList
                                        data={paginatedData}
                                        columns={[
                                            { label: 'Motivo Principal', key: 'ds_descricao' },
                                            { label: 'Tipo Vinculado', render: (i) => <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-500/20">{i.tipo?.ds_tipo_chamado}</span> }
                                        ]}
                                        onEdit={openModal}
                                        onToggle={(item) => handleToggleStatus(item, 'id_motivo_principal')}
                                    />
                                )}
                                {activeTab === "associados" && (
                                    <TableList
                                        data={paginatedData}
                                        columns={[
                                            { label: 'Detalhamento', key: 'ds_descricao_motivo' },
                                            { label: 'Motivo Pai', render: (i) => <span className="text-slate-600 dark:text-slate-400 font-medium">{i.motivo_principal?.ds_descricao}</span> },
                                            { label: 'Empresa', render: (i) => i.empresa ? <span className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase tracking-wider">{i.empresa.ds_empresa}</span> : <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Geral</span> }
                                        ]}
                                        onEdit={openModal}
                                        onToggle={(item) => handleToggleStatus(item, 'id_motivo_associado')}
                                    />
                                )}

                                {/* PAGINAÇÃO MODERNIZADA */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                            Total: {filteredData.length} itens
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="h-8 gap-1 px-3 text-[11px] font-bold uppercase tracking-wider"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                                            </Button>
                                            
                                            <div className="flex items-center gap-1 mx-2">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                                    .map((p, i, arr) => (
                                                        <React.Fragment key={p}>
                                                            {i > 0 && arr[i-1] !== p - 1 && <span className="text-slate-400">...</span>}
                                                            <button
                                                                onClick={() => setCurrentPage(p)}
                                                                className={cn(
                                                                    "w-8 h-8 rounded-md text-xs font-bold transition-all",
                                                                    currentPage === p
                                                                        ? "bg-indigo-600 text-white shadow-md"
                                                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                )}
                                                            >
                                                                {p}
                                                            </button>
                                                        </React.Fragment>
                                                    ))
                                                }
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="h-8 gap-1 px-3 text-[11px] font-bold uppercase tracking-wider"
                                            >
                                                Próximo <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* MODAL DE CADASTRO/EDIÇÃO */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:border-slate-800 dark:text-white p-0 overflow-hidden gap-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-xl">{editingItem ? "Editar Registro" : "Novo Cadastro"}</DialogTitle>
                            <DialogDescription className="dark:text-slate-400">Preencha as informações abaixo.</DialogDescription>
                        </DialogHeader>

                        <div className="p-6 pt-2">
                            <form onSubmit={handleSubmit} noValidate className="space-y-5">

                                {activeTab === 'tipos' && (
                                    <div className="space-y-1">
                                        <Label className={labelClass}>
                                            Descrição do Tipo <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            value={data.ds_tipo_chamado}
                                            onChange={e => setData('ds_tipo_chamado', e.target.value)}
                                            className={getInputClass(errors.ds_tipo_chamado)}
                                            placeholder="Ex: Infraestrutura"
                                        />
                                        <ErrorMessage message={errors.ds_tipo_chamado} />
                                    </div>
                                )}

                                {activeTab === 'motivos' && (
                                    <>
                                        <div className="space-y-1">
                                            <Label className={labelClass}>
                                                Vincular ao Tipo <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.id_tipo_chamado} onValueChange={v => setData('id_tipo_chamado', v)}>
                                                <SelectTrigger className={getInputClass(errors.id_tipo_chamado)}>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                                    {tipos.map(t => <SelectItem key={t.id_tipo_chamado} value={String(t.id_tipo_chamado)}>{t.ds_tipo_chamado}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <ErrorMessage message={errors.id_tipo_chamado} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className={labelClass}>
                                                Descrição do Motivo <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={data.ds_descricao}
                                                onChange={e => setData('ds_descricao', e.target.value)}
                                                className={getInputClass(errors.ds_descricao)}
                                                placeholder="Ex: Problema de Rede"
                                            />
                                            <ErrorMessage message={errors.ds_descricao} />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'associados' && (
                                    <>
                                        <div className="space-y-1">
                                            <Label className={labelClass}>
                                                Vincular ao Motivo Pai <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.id_motivo_principal} onValueChange={v => setData('id_motivo_principal', v)}>
                                                <SelectTrigger className={getInputClass(errors.id_motivo_principal)}>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                                    {motivos.map(m => (
                                                        <SelectItem key={m.id_motivo_principal} value={String(m.id_motivo_principal)}>
                                                            {m.tipo?.ds_tipo_chamado} &raquo; {m.ds_descricao}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <ErrorMessage message={errors.id_motivo_principal} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className={labelClass}>
                                                Descrição do Detalhe <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={data.ds_descricao_motivo}
                                                onChange={e => setData('ds_descricao_motivo', e.target.value)}
                                                className={getInputClass(errors.ds_descricao_motivo)}
                                            />
                                            <ErrorMessage message={errors.ds_descricao_motivo} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className={labelClass}>
                                                Restringir a Empresa
                                            </Label>
                                            <Select value={data.id_empresa} onValueChange={v => setData('id_empresa', v)}>
                                                <SelectTrigger className="h-12 font-semibold shadow-sm transition-colors bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-indigo-500">
                                                    <SelectValue placeholder="Visível para todas" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                                    <SelectItem value="null">-- Todas as Empresas --</SelectItem>
                                                    {empresas.map(e => <SelectItem key={e.id_empresa} value={String(e.id_empresa)}>{e.ds_empresa}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">Opcional. Se selecionar, aparece apenas para esta empresa.</p>
                                        </div>
                                    </>
                                )}

                                <DialogFooter className="pt-4 gap-2">
                                    <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="dark:bg-transparent dark:border-slate-600 dark:text-slate-300 h-10">Cancelar</Button>
                                    <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 shadow-md shadow-indigo-200 dark:shadow-none">
                                        {editingItem ? 'Salvar Alterações' : 'Cadastrar'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* MODAL CONFIRMAÇÃO (DESATIVAR) */}
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Confirmar ação</DialogTitle>
                            <DialogDescription className="dark:text-slate-400">
                                Deseja realmente {pendingAction?.item.st_ativo === 'A' ? 'DESATIVAR' : 'ATIVAR'} este registro?
                                {pendingAction?.item.st_ativo === 'A' && <span className="block mt-1 text-xs text-rose-500 font-bold">Ele não aparecerá mais nos formulários.</span>}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 justify-end mt-2">
                            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="dark:bg-transparent dark:border-slate-600 dark:text-slate-300">Cancelar</Button>
                            <Button
                                onClick={confirmToggleStatus}
                                className={pendingAction?.item.st_ativo === 'A' ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                            >
                                {pendingAction?.item.st_ativo === 'A' ? 'Sim, Desativar' : 'Sim, Ativar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </AppLayout>
    );
}

// Subcomponente Tabela (Visual Dark Mode Polido)
function TableList({ data, columns, onEdit, onToggle }) {
    if (data.length === 0) return <div className="p-12 text-center text-slate-400 dark:text-slate-500">Nenhum dado encontrado para a busca.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-3 w-16 text-slate-500 dark:text-slate-400 uppercase font-bold text-xs">Status</th>
                        {columns.map((c, i) => <th key={i} className="px-6 py-3 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold">{c.label}</th>)}
                        <th className="px-6 py-3 text-right text-slate-500 dark:text-slate-400 uppercase font-bold text-xs">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.map((item, idx) => (
                        <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${item.st_ativo === 'I' ? 'opacity-50 grayscale bg-slate-50/50 dark:bg-slate-800/50' : ''}`}>
                            <td className="px-6 py-4">
                                {item.st_ativo === 'A'
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    : <AlertTriangle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                }
                            </td>
                            {columns.map((col, i) => (
                                <td key={i} className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                                    {col.render ? col.render(item) : item[col.key]}
                                </td>
                            ))}
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                        <Edit className="w-4 h-4"/>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggle(item)}
                                        className={`h-8 w-8 ${item.st_ativo === 'A' ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                                        title={item.st_ativo === 'A' ? 'Desativar' : 'Ativar'}
                                    >
                                        <Power className="w-4 h-4"/>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}