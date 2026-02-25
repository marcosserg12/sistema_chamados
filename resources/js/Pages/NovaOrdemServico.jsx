import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  FileText,
  PenTool
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tiposServico = [
  { value: "manutencao_corretiva", label: "Manutenção Corretiva" },
  { value: "manutencao_preventiva", label: "Manutenção Preventiva" },
  { value: "instalacao", label: "Instalação" },
  { value: "configuracao", label: "Configuração" },
  { value: "outros", label: "Outros" },
];

export default function NovaOrdemServico({ chamado }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // 1. Hook useForm do Inertia
  const { data, setData, post, processing, errors } = useForm({
    chamado_id: chamado?.id || "",
    tipo_servico: "",
    procedimentos: "",
    horas_trabalho: 0,
    valor_mao_obra: 0,
    observacoes: "",
    materiais: [], // Lista de objetos {descricao, quantidade, valor_unitario, total}
    assinatura_base64: null,
  });

  // Cálculos Automáticos
  const valorMateriais = useMemo(() => {
    return data.materiais.reduce((sum, m) => sum + (m.total || 0), 0);
  }, [data.materiais]);

  const valorTotal = valorMateriais + (parseFloat(data.valor_mao_obra) || 0);

  // Lógica do Material
  const addMaterial = () => {
    setData("materiais", [
      ...data.materiais,
      { descricao: "", quantidade: 1, valor_unitario: 0, total: 0 }
    ]);
  };

  const updateMaterial = (index, field, value) => {
    const newMateriais = [...data.materiais];
    newMateriais[index][field] = value;
    if (field === "quantidade" || field === "valor_unitario") {
      newMateriais[index].total = newMateriais[index].quantidade * newMateriais[index].valor_unitario;
    }
    setData("materiais", newMateriais);
  };

  const removeMaterial = (index) => {
    setData("materiais", data.materiais.filter((_, i) => i !== index));
  };

  // Lógica do Canvas (Assinatura)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    canvasRef.current.getContext("2d").beginPath();
    canvasRef.current.getContext("2d").moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    canvasRef.current.getContext("2d").lineTo(x, y);
    canvasRef.current.getContext("2d").stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasSignature) {
      setData("assinatura_base64", canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
    setData("assinatura_base64", null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('os.store'), {
      onSuccess: () => toast.success("Ordem de Serviço gerada com sucesso!"),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={route('chamados.show', chamado.id)}>
            <Button variant="ghost" size="sm" className="mb-2"><ArrowLeft className="w-4 h-4 mr-2"/> Voltar</Button>
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">Gerar O.S.</h1>
          <p className="text-slate-500">Ref: #{chamado.id} - {chamado.titulo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <Card className="dark:bg-slate-800">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5"/> Dados do Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Serviço *</Label>
                <Select value={data.tipo_servico} onValueChange={(v) => setData("tipo_servico", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {tiposServico.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas Técnicas</Label>
                <Input type="number" step="0.5" value={data.horas_trabalho} onChange={e => setData("horas_trabalho", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Procedimentos Realizados</Label>
              <Textarea rows={4} value={data.procedimentos} onChange={e => setData("procedimentos", e.target.value)} placeholder="Descreva o que foi feito..." />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Materiais */}
        <Card className="dark:bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Peças e Materiais</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addMaterial}><Plus className="w-4 h-4 mr-2"/> Adicionar</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Qtd</TableHead>
                  <TableHead className="w-32">Unitário (R$)</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.materiais.map((mat, i) => (
                  <TableRow key={i}>
                    <TableCell><Input value={mat.descricao} onChange={e => updateMaterial(i, "descricao", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={mat.quantidade} onChange={e => updateMaterial(i, "quantidade", e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={mat.valor_unitario} onChange={e => updateMaterial(i, "valor_unitario", e.target.value)} /></TableCell>
                    <TableCell className="font-bold">{(mat.total || 0).toFixed(2)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeMaterial(i)}><Trash2 className="w-4 h-4 text-red-500"/></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Assinatura Digital */}
        <Card className="dark:bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><PenTool className="w-5 h-5"/> Assinatura do Cliente</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>Limpar</Button>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="w-full h-40 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rodapé de Custos e Envio */}
        <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-900 text-white rounded-xl shadow-xl">
          <div className="flex gap-8 mb-4 md:mb-0">
            <div><p className="text-xs text-slate-400">MATERIAIS</p><p className="text-xl font-bold">R$ {valorMateriais.toFixed(2)}</p></div>
            <div><p className="text-xs text-slate-400">TOTAL O.S.</p><p className="text-2xl font-black text-blue-400">R$ {valorTotal.toFixed(2)}</p></div>
          </div>
          <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-500 h-12 px-8 text-lg font-bold">
            {processing ? <Loader2 className="animate-spin mr-2" /> : "Finalizar e Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}