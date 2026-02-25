import React, { useState, useEffect, useRef } from "react";
import { Link, Head, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Inbox, Activity, CheckCircle2, User, MapPin, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Chamados({ chamados, tecnicos, localizacoes = [], stats, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [status, setStatus] = useState(filters?.status || "todos");
    const [tecnico, setTecnico] = useState(filters?.tecnico || "todos");
    const [localizacao, setLocalizacao] = useState(filters?.localizacao || "todos");

    const isFirstRender = useRef(true);

    // =========================================================================
    // PESQUISA E FILTROS EM TEMPO REAL
    // =========================================================================
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                "/chamados",
                { search, status, tecnico, localizacao },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [search, status, tecnico, localizacao]);

    // =========================================================================
    // RENDERIZADOR DE STATUS
    // =========================================================================
    const renderStatus = (statusId) => {
        switch (String(statusId)) {
            case "0":
                return (
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap">
                        Aberto
                    </span>
                );
            case "1":
                return (
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap">
                        Em Andamento
                    </span>
                );
            case "9":
                return (
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap">
                        Resolvido
                    </span>
                );
            default:
                return (
                    <span className="bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 dark:border dark:border-slate-600/50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap">
                        Desconhecido
                    </span>
                );
        }
    };

    return (
        <AppLayout>
            <Head title="Todos os Chamados" />

            <div className="max-w-full mx-auto pb-6">
                {/* CABEÇALHO E FILTROS */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex-shrink-0">
                        Todos os Chamados
                    </h1>

                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-sm focus:ring-0 text-[14px] hover:dark:border-slate-600 font-medium transition-colors">
                                <SelectValue placeholder="Todos os Status" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                <SelectItem value="todos" className="text-[14px] dark:focus:bg-slate-700 font-medium">Todos os Status</SelectItem>
                                <SelectItem value="0" className="text-[14px] dark:focus:bg-slate-700 font-medium">Aberto</SelectItem>
                                <SelectItem value="1" className="text-[14px] dark:focus:bg-slate-700 font-medium">Em Andamento</SelectItem>
                                <SelectItem value="9" className="text-[14px] dark:focus:bg-slate-700 font-medium">Resolvido</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={tecnico} onValueChange={setTecnico}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-sm focus:ring-0 text-[14px] hover:dark:border-slate-600 font-medium transition-colors">
                                <SelectValue placeholder="Todos os Usuários" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                <SelectItem value="todos" className="text-[14px] dark:focus:bg-slate-700 font-medium">Todos os Usuários</SelectItem>
                                {tecnicos?.map((tec) => (
                                    <SelectItem key={tec.id_usuario} value={String(tec.id_usuario)} className="text-[14px] dark:focus:bg-slate-700 font-medium">
                                        {tec.ds_nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={localizacao} onValueChange={setLocalizacao}>
                            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-sm focus:ring-0 text-[14px] hover:dark:border-slate-600 font-medium transition-colors">
                                <SelectValue placeholder="Todas as Localizações" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                <SelectItem value="todos" className="text-[14px] dark:focus:bg-slate-700 font-medium">Todas as Localizações</SelectItem>
                                {localizacoes?.map((loc) => (
                                    <SelectItem key={loc.id_localizacao} value={String(loc.id_localizacao)} className="text-[14px] dark:focus:bg-slate-700 font-medium">
                                        {loc.ds_localizacao}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* CARDS DE ESTATÍSTICAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm rounded-lg backdrop-blur-sm">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center shrink-0 border border-transparent dark:border-blue-500/20">
                                <Inbox className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">
                                    Abertos
                                </span>
                                <span className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">
                                    {stats?.abertos || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm rounded-lg backdrop-blur-sm">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center shrink-0 border border-transparent dark:border-amber-500/20">
                                <Activity className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">
                                    Em Andamento
                                </span>
                                <span className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">
                                    {stats?.em_andamento || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm rounded-lg backdrop-blur-sm">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 border border-transparent dark:border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">
                                    Resolvidos
                                </span>
                                <span className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">
                                    {stats?.resolvidos || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CONTAINER DA TABELA */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-lg overflow-hidden flex flex-col backdrop-blur-sm">
                    {/* BARRA DE PESQUISA */}
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <Input
                                placeholder="Buscar chamados..."
                                className="pl-8 h-9 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-[14px] dark:text-slate-300 dark:placeholder-slate-500 focus-visible:ring-indigo-500 shadow-none hover:dark:border-slate-600 transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* TABELA DENSA */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-[14px]">
                            <thead className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/80">
                                <tr>
                                    <th className="px-4 py-4">ID</th>
                                    <th className="px-4 py-4">TÍTULO</th>
                                    <th className="px-4 py-4">MOTIVO</th>
                                    <th className="px-4 py-4">LOCALIZAÇÃO</th>
                                    <th className="px-4 py-4">CRIADOR</th>
                                    <th className="px-4 py-4">ATRIBUÍDO</th>
                                    <th className="px-4 py-4 text-center">STATUS</th>
                                    <th className="px-4 py-4">DATA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300">
                                {!chamados.data || chamados.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                                        >
                                            Nenhum chamado encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    chamados.data.map((chamado) => (
                                        <tr
                                            key={chamado.id_chamado}
                                            onClick={() =>
                                                router.get(`/chamados/${chamado.id_chamado}`)
                                            }
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-4 py-3.5 text-slate-400 dark:text-slate-500 font-medium group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                                #{chamado.id_chamado}
                                            </td>
                                            <td
                                                className="px-4 py-3.5 text-slate-800 dark:text-slate-100 font-semibold min-w-[200px]"
                                                title={chamado.ds_titulo}
                                            >
                                                {chamado.ds_titulo}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                                                    <Tag className="w-3.5 h-3.5" />
                                                    {chamado.ds_motivo || "Geral"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {chamado.ds_localizacao ? (
                                                    <div
                                                        className="flex items-center gap-1.5"
                                                        title={chamado.ds_localizacao}
                                                    >
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                                        <span>
                                                            {chamado.ds_localizacao}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">-</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {chamado.ds_nome_solicitante ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {chamado.ds_nome_solicitante}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">-</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {chamado.ds_nome_tecnico ? (
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar className="w-7 h-7 border border-white dark:border-slate-700">
                                                            {chamado.ds_foto_tecnico ? (
                                                                <img 
                                                                    src={`/storage/${chamado.ds_foto_tecnico}`} 
                                                                    className="aspect-square h-full w-full object-cover" 
                                                                />
                                                            ) : (
                                                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                                                                    {chamado.ds_nome_tecnico?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                                </AvatarFallback>
                                                            )}
                                                        </Avatar>
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {chamado.ds_nome_tecnico}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 italic text-[12px]">
                                                        <User className="w-3.5 h-3.5 opacity-50" />
                                                        Aguardando...
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                {renderStatus(chamado.st_status)}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                                                {format(
                                                    new Date(chamado.dt_data_chamado),
                                                    "dd/MM/yyyy",
                                                    { locale: ptBR },
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* RODAPÉ E PAGINAÇÃO */}
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                            Mostrando {chamados.from || 0} até {chamados.to || 0} de {chamados.total || 0}
                        </div>

                        {chamados.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {chamados.links.map((link, index) => {
                                    const isPrevious = index === 0;
                                    const isNext = index === chamados.links.length - 1;
                                    
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
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}