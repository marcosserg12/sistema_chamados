import React from "react";
import { Link, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  ArrowLeft,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig = {
  rascunho: { label: "Rascunho", className: "bg-slate-100 text-slate-700" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", className: "bg-amber-100 text-amber-700" },
  aprovado: { label: "Aprovado", className: "bg-emerald-100 text-emerald-700" },
  rejeitado: { label: "Rejeitado", className: "bg-rose-100 text-rose-700" },
  concluido: { label: "Concluído", className: "bg-blue-100 text-blue-700" },
};

export default function OrdemServicoDetalhes({ ordem, chamado }) {
  const { auth } = usePage().props;
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Função para mudar o status (Aprovar, Rejeitar, Concluir)
  const updateStatus = (newStatus) => {
    setIsProcessing(true);
    router.patch(route('os.update-status', ordem.id), { status: newStatus }, {
      onSuccess: () => {
        toast.success(`O.S. marcada como ${newStatus.replace('_', ' ')}`);
        setIsProcessing(false);
      },
      onError: () => setIsProcessing(false)
    });
  };

  const statusInfo = statusConfig[ordem.status] || statusConfig.rascunho;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={route('os.index')}>
            <Button variant="ghost" size="sm" className="mb-2 dark:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold dark:text-white">{ordem.numero}</h1>
            <Badge className={cn("font-medium", statusInfo.className)}>
              {statusInfo.label}
            </Badge>
          </div>
          {chamado && (
            <Link href={route('chamados.show', chamado.id)} className="text-sm text-blue-600 hover:underline">
              Chamado #{chamado.id} - {chamado.titulo}
            </Link>
          )}
        </div>

        {/* Botões de Ação Condicionais */}
        <div className="flex gap-2">
          {ordem.status === "rascunho" && (
            <Button onClick={() => updateStatus("aguardando_aprovacao")} disabled={isProcessing} className="bg-amber-500">
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Clock className="mr-2" />}
              Enviar p/ Aprovação
            </Button>
          )}
          {ordem.status === "aguardando_aprovacao" && (
            <>
              <Button variant="outline" onClick={() => updateStatus("rejeitado")} className="text-rose-600 border-rose-200">
                <XCircle className="mr-2" /> Rejeitar
              </Button>
              <Button onClick={() => updateStatus("aprovado")} className="bg-emerald-600">
                <CheckCircle className="mr-2" /> Aprovar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 dark:bg-slate-800">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText /> Detalhes do Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase">Técnico Responsável</span>
                <p className="font-medium dark:text-white">{ordem.tecnico?.name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Tipo de Serviço</span>
                <p className="font-medium dark:text-white capitalize">{ordem.tipo_servico.replace('_', ' ')}</p>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Procedimentos Executados</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg whitespace-pre-wrap">
                {ordem.procedimentos || "Nenhum procedimento registrado."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card className="dark:bg-slate-800">
          <CardHeader><CardTitle className="text-lg">Custos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Mão de Obra</span>
              <span className="dark:text-white">R$ {parseFloat(ordem.valor_mao_obra).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Materiais</span>
              <span className="dark:text-white">R$ {parseFloat(ordem.valor_materiais).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-4 border-t font-bold text-lg">
              <span className="dark:text-white">Total</span>
              <span className="text-blue-600">R$ {parseFloat(ordem.valor_total).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Materiais (vinda do campo JSON do MySQL) */}
      {ordem.materiais?.length > 0 && (
        <Card className="dark:bg-slate-800">
          <CardHeader><CardTitle>Materiais Utilizados</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Unitário</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordem.materiais.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="dark:text-slate-300">{m.descricao}</TableCell>
                    <TableCell className="text-center dark:text-slate-300">{m.quantidade}</TableCell>
                    <TableCell className="text-right dark:text-slate-300">R$ {parseFloat(m.valor_unitario).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold dark:text-white">R$ {parseFloat(m.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Seção de Assinatura */}
      {ordem.assinatura_base64 && (
        <Card className="dark:bg-slate-800">
          <CardHeader><CardTitle>Assinatura Digital do Cliente</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
              <img src={ordem.assinatura_base64} alt="Assinatura" className="max-h-32" />
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tighter">
                Assinado eletronicamente em {format(new Date(ordem.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}