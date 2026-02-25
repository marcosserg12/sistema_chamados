import React, { useState } from "react";
import { Link, router } from '@inertiajs/react';
import { Card, CardContent } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import {
  Search,
  FileText,
  User,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusConfig = {
  rascunho: { label: "Rascunho", icon: FileText, className: "bg-slate-100 text-slate-700" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", icon: Clock, className: "bg-amber-100 text-amber-700" },
  aprovado: { label: "Aprovado", icon: CheckCircle, className: "bg-emerald-100 text-emerald-700" },
  rejeitado: { label: "Rejeitado", icon: XCircle, className: "bg-rose-100 text-rose-700" },
  concluido: { label: "Concluído", icon: FileCheck, className: "bg-blue-100 text-blue-700" },
};

export default function OrdensServico({ ordens, filters }) {
  const [search, setSearch] = useState(filters.search || "");

  // Função para atualizar filtros via URL (Inertia)
  const handleFilterChange = (key, value) => {
    router.get(route('os.index'), {
      ...filters,
      [key]: value
    }, {
      preserveState: true,
      replace: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ordens de Serviço</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitoramento financeiro e técnico dos serviços prestados
        </p>
      </div>

      {/* Filtros */}
      <Card className="dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por O.S. ou técnico..."
                className="pl-10 dark:bg-slate-700"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => handleFilterChange('search', search)}
              />
            </div>
            <Select
              value={filters.status || "todos"}
              onValueChange={(v) => handleFilterChange('status', v)}
            >
              <SelectTrigger className="w-48 dark:bg-slate-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de O.S. */}
      <Card className="dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº O.S.</TableHead>
                <TableHead>Chamado Ref.</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordens.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    Nenhuma ordem de serviço encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                ordens.data.map((ordem) => {
                  const statusInfo = statusConfig[ordem.status] || statusConfig.rascunho;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow key={ordem.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <TableCell className="font-mono text-blue-600">
                        <Link href={route('os.show', ordem.id)}>{ordem.numero}</Link>
                      </TableCell>
                      <TableCell>
                        {ordem.chamado ? (
                          <Link href={route('chamados.show', ordem.chamado.id)} className="text-sm dark:text-slate-300 hover:underline">
                            #{ordem.chamado.id} - {ordem.chamado.titulo.substring(0, 20)}...
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm dark:text-slate-300">
                          <User className="w-3 h-3 text-slate-400" />
                          {ordem.tecnico?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        R$ {parseFloat(ordem.valor_total).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          statusInfo.className
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(new Date(ordem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}