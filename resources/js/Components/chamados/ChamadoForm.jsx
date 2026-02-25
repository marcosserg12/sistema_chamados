import React, { useState, useEffect } from "react";
import { useForm, usePage } from '@inertiajs/react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info, Paperclip, X, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function ChamadoForm({ empresas, tiposChamado }) {
  // 1. Estado do formulário via Inertia
  const { data, setData, post, processing, errors } = useForm({
    ds_titulo: '',
    id_empresa: '',
    id_localizacao: '',
    id_tipo_chamado: '',
    id_motivo_principal: '',
    id_motivo_associado: '',
    ds_patrimonio: '',
    st_grau: '',
    ds_descricao: '',
    arquivos: []
  });

  // 2. Estados para listas dinâmicas (Dependent Selects)
  const [localizacoes, setLocalizacoes] = useState([]);
  const [motivosPrincipais, setMotivosPrincipais] = useState([]);
  const [detalhamentos, setDetalhamentos] = useState([]);
  const [previews, setPreviews] = useState([]);

  // --- Lógica de Busca Dinâmica (Substitui seus $.ajax do jQuery) ---

  // Buscar Localizações ao mudar Empresa
  useEffect(() => {
    if (data.id_empresa) {
      fetch(`/api/lookup/localizacoes/${data.id_empresa}`)
        .then(res => res.json())
        .then(json => setLocalizacoes(json));
    }
  }, [data.id_empresa]);

  // Buscar Motivos ao mudar Tipo de Chamado
  useEffect(() => {
    if (data.id_tipo_chamado) {
      fetch(`/api/lookup/motivos/${data.id_tipo_chamado}`)
        .then(res => res.json())
        .then(json => setMotivosPrincipais(json));
    }
  }, [data.id_tipo_chamado]);

  // Buscar Detalhamento ao mudar Motivo Principal
  useEffect(() => {
    if (data.id_motivo_principal) {
      fetch(`/api/detalhamentos/${data.id_motivo_principal}?empresa_id=${data.id_empresa}`)
        .then(res => res.json())
        .then(json => setDetalhamentos(json));
    }
  }, [data.id_motivo_principal, data.id_empresa]);

  // --- Handlers ---

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setData('arquivos', [...data.arquivos, ...files]);

    // Gerar previews visuais
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = data.arquivos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setData('arquivos', newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('chamados.store'), {
      onSuccess: () => toast.success("Chamado enviado com sucesso!"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="dark:bg-slate-800 border-none shadow-lg">
        <CardContent className="p-6 space-y-6">

          {/* Título */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">Título do Problema *</Label>
            <Input
              value={data.ds_titulo}
              onChange={e => setData('ds_titulo', e.target.value)}
              placeholder="Ex: Impressora não liga"
              className="focus-visible:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empresa */}
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={data.id_empresa} onValueChange={v => setData('id_empresa', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {empresas.map(emp => (
                    <SelectItem key={emp.id_empresa} value={String(emp.id_empresa)}>{emp.ds_empresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Localização */}
            <div className="space-y-2">
              <Label>Localização / Setor *</Label>
              <Select value={data.id_localizacao} onValueChange={v => setData('id_localizacao', v)} disabled={!data.id_empresa}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {localizacoes.map(loc => (
                    <SelectItem key={loc.id_localizacao} value={String(loc.id_localizacao)}>{loc.ds_localizacao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categorização */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t dark:border-slate-700 pt-4">
            <div className="space-y-2">
              <Label>Tipo de Chamado</Label>
              <Select value={data.id_tipo_chamado} onValueChange={v => setData('id_tipo_chamado', v)}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  {tiposChamado.map(t => (
                    <SelectItem key={t.id_tipo_chamado} value={String(t.id_tipo_chamado)}>{t.ds_tipo_chamado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo Principal</Label>
              <Select value={data.id_motivo_principal} onValueChange={v => setData('id_motivo_principal', v)} disabled={!data.id_tipo_chamado}>
                <SelectTrigger><SelectValue placeholder="Motivo" /></SelectTrigger>
                <SelectContent>
                  {motivosPrincipais.map(m => (
                    <SelectItem key={m.id_motivo_principal} value={String(m.id_motivo_principal)}>{m.ds_descricao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Detalhamento</Label>
              <Select value={data.id_motivo_associado} onValueChange={v => setData('id_motivo_associado', v)} disabled={!data.id_motivo_principal}>
                <SelectTrigger><SelectValue placeholder="Detalhe" /></SelectTrigger>
                <SelectContent>
                  {detalhamentos.map(d => (
                    <SelectItem key={d.id_motivo_associado} value={String(d.id_motivo_associado)}>{d.ds_descricao_motivo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção Condicional: Patrimônio (Se tipo for Hardware/Equipamento - ID 1) */}
          {data.id_tipo_chamado === "1" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="flex items-center gap-2">
                Nº do Patrimônio
                <span title="Etiqueta colada no equipamento"><Info className="w-4 h-4 text-blue-500 cursor-help" /></span>
              </Label>
              <Input
                value={data.ds_patrimonio}
                onChange={e => setData('ds_patrimonio', e.target.value)}
                placeholder="Informe o código da etiqueta"
              />
            </div>
          )}

          {/* Seção Condicional: Grau de Urgência (Se motivo principal for específico - ID 6) */}
          {data.id_motivo_principal === "6" && (
            <div className="space-y-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <Label>Classificação do Pedido *</Label>
              <RadioGroup value={data.st_grau} onValueChange={v => setData('st_grau', v)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="r1" /> <Label htmlFor="r1">Melhoria</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="r2" /> <Label htmlFor="r2">Problema</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="r3" /> <Label htmlFor="r3">Cadastro</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição Detalhada *</Label>
            <Textarea
              value={data.ds_descricao}
              onChange={e => setData('ds_descricao', e.target.value)}
              placeholder="Descreva aqui o que está acontecendo..."
              rows={5}
            />
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <Label>Anexos (Fotos ou Documentos)</Label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors relative">
              <input
                type="file"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Paperclip className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Clique para anexar ou arraste arquivos aqui</p>
            </div>

            {/* Listagem de Previews */}
            <div className="flex flex-wrap gap-4 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg border overflow-hidden">
                  <img src={src} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rodapé de Ações */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
        <Button
          type="submit"
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-500 h-12 px-8 font-bold"
        >
          {processing ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Abrir Chamado
        </Button>
      </div>
    </form>
  );
}