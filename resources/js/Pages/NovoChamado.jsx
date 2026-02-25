import React, { useState, useEffect } from "react";
import { Link, Head, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, UploadCloud, X, File as FileIcon, Send, Loader2, Info,
  Server, Monitor, HelpCircle, CheckCircle2, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

export default function NovoChamado({ empresas = [], tiposChamado = [] }) {
  const { auth } = usePage().props;
  const prefs = auth.user?.preferencias || {};
  const isFirstRender = React.useRef(true);

  const { data, setData, post, processing } = useForm({
    ds_titulo: "",
    id_empresa: prefs.id_empresa_padrao ? String(prefs.id_empresa_padrao) : "",
    id_localizacao: prefs.id_localizacao_padrao ? String(prefs.id_localizacao_padrao) : "",
    id_tipo_chamado: "",
    id_motivo_principal: "",
    id_motivo_associado: "",
    st_grau: "",
    ds_patrimonio: "",
    ds_descricao: "",
    arquivos: [],
  });

  const [localizacoes, setLocalizacoes] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [detalhes, setDetalhes] = useState([]);
  const [loadingSelects, setLoadingSelects] = useState({});
  const [localErrors, setLocalErrors] = useState({});

  // =========================================================================
  // 1. AUTO-SELEÇÃO DE EMPRESA (NOVA LÓGICA)
  // =========================================================================
  useEffect(() => {
    if (empresas.length === 1 && !data.id_empresa) {
        setData("id_empresa", String(empresas[0].id_empresa));
    }
  }, [empresas]);

  // =========================================================================
  // LÓGICA DO CTRL+V (COLAR IMAGENS)
  // =========================================================================
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const newFile = new File([blob], `imagem_colada_${Date.now()}_${i}.png`, { type: blob.type });
            pastedFiles.push(newFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        if (data.arquivos.length + pastedFiles.length > 5) {
          toast.error("Limite máximo de 5 anexos atingido.");
          return;
        }
        setData("arquivos", [...data.arquivos, ...pastedFiles]);
        toast.success(`${pastedFiles.length} imagem(ns) colada(s) com sucesso!`);
        setLocalErrors(prev => ({ ...prev, arquivos: null }));
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [data.arquivos]);

  // =========================================================================
  // LÓGICA DE CASCATA (AJAX)
  // =========================================================================
  useEffect(() => {
    if (data.id_empresa) {
      setLoadingSelects(p => ({ ...p, localizacao: true }));
      setLocalErrors(prev => ({ ...prev, id_empresa: null }));
      axios.get(`/api/localizacoes?id_empresa=${data.id_empresa}`)
        .then(res => {
            setLocalizacoes(res.data);
            // Se NÃO for a primeira renderização, limpa a localização selecionada pois a empresa mudou
            if (!isFirstRender.current) {
                setData("id_localizacao", "");
            }
            isFirstRender.current = false;
        })
        .catch(() => toast.error("Erro ao carregar localizações"))
        .finally(() => setLoadingSelects(p => ({ ...p, localizacao: false })));
    } else {
      setLocalizacoes([]);
      setData("id_localizacao", "");
    }
  }, [data.id_empresa]);

  useEffect(() => {
    if (data.id_tipo_chamado) {
      setLoadingSelects(p => ({ ...p, motivo: true }));
      setLocalErrors(prev => ({ ...prev, id_tipo_chamado: null }));
      axios.get(`/api/motivos?id_tipo_chamado=${data.id_tipo_chamado}`)
        .then(res => setMotivos(res.data))
        .catch(() => toast.error("Erro ao carregar motivos"))
        .finally(() => setLoadingSelects(p => ({ ...p, motivo: false })));
    } else {
      setMotivos([]);
      setData("id_motivo_principal", "");
    }

    if (data.id_tipo_chamado !== "1") setData("ds_patrimonio", "");
  }, [data.id_tipo_chamado]);

  useEffect(() => {
    if (data.id_motivo_principal) {
      setLoadingSelects(p => ({ ...p, detalhe: true }));
      setLocalErrors(prev => ({ ...prev, id_motivo_principal: null }));
      const url = data.id_motivo_principal === "6"
        ? `/api/detalhes-motivo?id_motivo=${data.id_motivo_principal}&id_empresa=${data.id_empresa}`
        : `/api/detalhes-motivo?id_motivo=${data.id_motivo_principal}`;

      axios.get(url)
        .then(res => setDetalhes(res.data))
        .catch(() => toast.error("Erro ao carregar detalhamentos"))
        .finally(() => setLoadingSelects(p => ({ ...p, detalhe: false })));
    } else {
      setDetalhes([]);
      setData("id_motivo_associado", "");
    }

    if (data.id_motivo_principal !== "6") setData("st_grau", "");
  }, [data.id_motivo_principal, data.id_empresa]);

  useEffect(() => { if (data.id_motivo_associado) setLocalErrors(prev => ({ ...prev, id_motivo_associado: null })); }, [data.id_motivo_associado]);
  useEffect(() => { if (data.id_localizacao) setLocalErrors(prev => ({ ...prev, id_localizacao: null })); }, [data.id_localizacao]);
  useEffect(() => { if (data.ds_descricao) setLocalErrors(prev => ({ ...prev, ds_descricao: null })); }, [data.ds_descricao]);
  useEffect(() => { if (data.ds_titulo) setLocalErrors(prev => ({ ...prev, ds_titulo: null })); }, [data.ds_titulo]);
  useEffect(() => { if (data.st_grau) setLocalErrors(prev => ({ ...prev, st_grau: null })); }, [data.st_grau]);

  // =========================================================================
  // TEMPLATE AUTOMÁTICO PARA CADASTRO DE PACIENTE
  // =========================================================================
  useEffect(() => {
    if (data.st_grau === "3") {
      // Se mudar para Cadastro de Paciente e a descrição estiver vazia (ou for outro template)
      // Preenche com o template
      if (!data.ds_descricao || !data.ds_descricao.includes("Nome da Mãe:")) {
        const template = `Setor*: 
Leito*: 
Nome Completo*: 
Nome da Mãe: 
Número do Atendimento*: 
Convênio*: 
Telefone*: 
Sexo*: 
Data de Admissão Hospitalar*: 
Data de Admissão na EMTN*: 
Data de Nascimento*: 
Terapia Nutricional de Entrada*: 
Diagnóstico*: 
Especialidade*: 
Motivo da Internação: 
Diagnósticos Secundários: 
Comorbidades: `;
        
        setData("ds_descricao", template);
      }
    } else {
      // Se mudar para qualquer outra coisa (Melhoria, Problema, Relatório)
      // E a descrição contiver o template de paciente, limpamos ela
      if (data.ds_descricao && data.ds_descricao.includes("Nome da Mãe:")) {
        setData("ds_descricao", "");
      }
    }
  }, [data.st_grau]);

  // =========================================================================
  // GESTÃO DE ARQUIVOS MANUAIS E HELPERS
  // =========================================================================
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (data.arquivos.length + files.length > 5) {
      toast.error("Limite máximo de 5 arquivos atingido.");
      return;
    }
    setData("arquivos", [...data.arquivos, ...files]);
    e.target.value = null;
  };

  const removeFile = (index) => {
    const newFiles = [...data.arquivos];
    newFiles.splice(index, 1);
    setData("arquivos", newFiles);
  };

  const getCardInfo = (nome) => {
    const lower = nome.toLowerCase();
    if (lower.includes('infra')) return { icon: Server, desc: 'Hardware, redes, equipamentos' };
    if (lower.includes('sistema')) return { icon: Monitor, desc: 'Software, aplicações, erros' };
    return { icon: HelpCircle, desc: 'Dúvidas e orientações' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = {};
    if (!data.ds_titulo.trim()) errors.ds_titulo = "O título é obrigatório.";
    if (!data.id_tipo_chamado) errors.id_tipo_chamado = "Selecione uma categoria principal.";
    if (!data.id_motivo_principal) errors.id_motivo_principal = "Selecione um motivo.";
    if (!data.id_motivo_associado) errors.id_motivo_associado = "Selecione o detalhamento.";
    if (data.id_motivo_principal === "6" && !data.st_grau) errors.st_grau = "Selecione o tipo de solicitação.";
    if (!data.id_empresa) errors.id_empresa = "A empresa é obrigatória.";
    if (!data.id_localizacao) errors.id_localizacao = "A localização é obrigatória.";
    if (!data.ds_descricao.trim()) errors.ds_descricao = "A descrição não pode ficar vazia.";

    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      toast.error("Existem campos obrigatórios em falta.", {
        description: "Por favor, verifique os itens destacados a vermelho."
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    post('/chamados', {
      preserveScroll: true,
      onSuccess: () => toast.success("Chamado criado com sucesso!"),
      onError: () => toast.error("Ocorreu um erro no servidor. Tente novamente."),
    });
  };

  return (
    <AppLayout>
      <Head title="Novo Chamado" />

      <div className="max-w-5xl mx-auto space-y-8 pb-12">

        {/* ================= CABEÇALHO ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 sm:px-10 py-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/chamados" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/50 p-2.5 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Novo Chamado
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium ml-[3.25rem]">
              Preencha os detalhes abaixo para que a nossa equipa possa ajudar o mais rápido possível.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardContent className="space-y-10 p-6 sm:p-10">

              {/* 1. TÍTULO */}
              <div className=" gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2 block">
                  Título Resumido <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={data.ds_titulo}
                  onChange={e => setData("ds_titulo", e.target.value)}
                  placeholder="Ex: Impressora do financeiro não liga"
                  className={cn(
                    "h-12 text-base shadow-sm transition-colors",
                    localErrors.ds_titulo
                      ? "border-rose-500 bg-rose-50/50 dark:bg-rose-500/10 focus-visible:ring-rose-500"
                      : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-indigo-500"
                  )}
                />
                {localErrors.ds_titulo && (
                  <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {localErrors.ds_titulo}
                  </p>
                )}
              </div>

              {/* 2. EMPRESA E LOCALIZAÇÃO (AGORA NO TOPO) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 ">
                <div>
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">
                    Empresa <span className="text-rose-500">*</span>
                  </label>
                  <Select value={String(data.id_empresa)} onValueChange={v => setData("id_empresa", v)}>
                    <SelectTrigger className={cn("h-12 font-semibold shadow-sm transition-colors", localErrors.id_empresa ? "border-rose-500 bg-rose-50/50" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700")}>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map(e => (
                        <SelectItem key={e.id_empresa} value={String(e.id_empresa)}>{e.ds_empresa}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {localErrors.id_empresa && <p className="text-rose-500 text-[11px] font-bold mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {localErrors.id_empresa}</p>}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">
                    Localização <span className="text-rose-500">*</span>
                  </label>
                  <Select value={String(data.id_localizacao)} onValueChange={v => setData("id_localizacao", v)} disabled={!data.id_empresa || loadingSelects.localizacao}>
                    <SelectTrigger className={cn("h-12 font-semibold shadow-sm transition-colors", localErrors.id_localizacao ? "border-rose-500 bg-rose-50/50" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700")}>
                      <SelectValue placeholder={loadingSelects.localizacao ? "A carregar..." : "Selecione a localização"} />
                    </SelectTrigger>
                    <SelectContent>
                      {localizacoes.map(l => (
                        <SelectItem key={l.id_localizacao} value={String(l.id_localizacao)}>{l.ds_localizacao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {localErrors.id_localizacao && <p className="text-rose-500 text-[11px] font-bold mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {localErrors.id_localizacao}</p>}
                </div>
              </div>

              {/* 3. TIPO DE CHAMADO */}
              <div className={cn("p-4 -mx-4 rounded-2xl transition-colors", localErrors.id_tipo_chamado && "bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-900")}>
                <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 block px-4">
                  Categoria Principal <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                  {tiposChamado.map((tipo) => {
                    const info = getCardInfo(tipo.ds_tipo_chamado);
                    const isSelected = String(data.id_tipo_chamado) === String(tipo.id_tipo_chamado);

                    return (
                      <button
                        key={tipo.id_tipo_chamado}
                        type="button"
                        onClick={() => setData("id_tipo_chamado", String(tipo.id_tipo_chamado))}
                        className={cn(
                          "flex-1 relative text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4",
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-md"
                            : localErrors.id_tipo_chamado
                              ? "border-rose-300 hover:border-rose-400 bg-white dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white"
                        )}
                      >
                        <div className={cn(
                          "p-3 rounded-xl shrink-0 transition-colors shadow-sm",
                          isSelected ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600"
                        )}>
                          <info.icon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className={cn("font-extrabold text-base mb-1", isSelected ? "text-indigo-900 dark:text-indigo-400" : "text-slate-800 dark:text-slate-200")}>
                            {tipo.ds_tipo_chamado}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            {info.desc}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-5 right-5 text-indigo-600">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {localErrors.id_tipo_chamado && (
                  <p className="text-rose-500 text-xs font-bold mt-3 px-4 flex items-center gap-1.5 animate-in fade-in">
                    <AlertTriangle className="w-3.5 h-3.5" /> {localErrors.id_tipo_chamado}
                  </p>
                )}
              </div>

              {/* 4. MOTIVO E DETALHE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Motivo <span className="text-rose-500">*</span></label>
                  <Select value={data.id_motivo_principal} onValueChange={v => setData("id_motivo_principal", v)} disabled={!data.id_tipo_chamado || loadingSelects.motivo}>
                    <SelectTrigger className={cn("h-12 font-semibold shadow-sm transition-colors", localErrors.id_motivo_principal ? "border-rose-500 bg-rose-50/50" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700")}>
                      <SelectValue placeholder={loadingSelects.motivo ? "A carregar..." : "Selecione o motivo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {motivos.map(m => (
                        <SelectItem key={m.id_motivo_principal} value={String(m.id_motivo_principal)}>{m.ds_descricao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {localErrors.id_motivo_principal && <p className="text-rose-500 text-[11px] font-bold mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {localErrors.id_motivo_principal}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Detalhamento <span className="text-rose-500">*</span></label>
                  <Select value={data.id_motivo_associado} onValueChange={v => setData("id_motivo_associado", v)} disabled={!data.id_motivo_principal || loadingSelects.detalhe}>
                    <SelectTrigger className={cn("h-12 font-semibold shadow-sm transition-colors", localErrors.id_motivo_associado ? "border-rose-500 bg-rose-50/50" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700")}>
                      <SelectValue placeholder={loadingSelects.detalhe ? "A carregar..." : "Selecione o detalhe"} />
                    </SelectTrigger>
                    <SelectContent>
                      {detalhes.map(d => (
                        <SelectItem key={d.id_motivo_associado} value={String(d.id_motivo_associado)}>{d.ds_descricao_motivo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {localErrors.id_motivo_associado && <p className="text-rose-500 text-[11px] font-bold mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {localErrors.id_motivo_associado}</p>}
                </div>

                {/* Grau Condicional */}
                {data.id_motivo_principal === "6" && (
                  <div className={cn("md:col-span-2 p-5 rounded-xl border mt-2 transition-colors", localErrors.st_grau ? "bg-rose-50 dark:bg-rose-900/10 border-rose-400" : "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/50")}>
                    <label className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-4 block">
                      Tipo de Solicitação <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-6">
                      {['1', '2', '3', '4'].map((val) => (
                        <label key={val} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="st_grau"
                            value={val}
                            checked={data.st_grau === val}
                            onChange={(e) => setData("st_grau", e.target.value)}
                            className="w-5 h-5 text-rose-600 border-rose-300 focus:ring-rose-500 cursor-pointer"
                          />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-600 transition-colors">
                            {val === '1' ? 'Melhoria' : val === '2' ? 'Problema' : val === '3' ? 'Cadastro de Paciente' : 'Relatório'}
                          </span>
                        </label>
                      ))}
                    </div>
                    {localErrors.st_grau && <p className="text-rose-500 text-[11px] font-bold mt-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {localErrors.st_grau}</p>}
                  </div>
                )}

                {/* Patrimônio Condicional */}
                {data.id_tipo_chamado === "1" && (
                  <div className="md:col-span-2 bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/50 relative group mt-2">
                    <label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      Número do Patrimônio
                      <Info className="w-4 h-4 cursor-pointer text-amber-500" />
                    </label>
                    <div className="absolute hidden group-hover:block z-10 bottom-full left-4 mb-2 w-64 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl">
                      Encontre a etiqueta colada no equipamento e informe o número exatamente como aparece.
                    </div>
                    <Input
                      value={data.ds_patrimonio}
                      onChange={e => setData("ds_patrimonio", e.target.value)}
                      placeholder="Ex: 001234"
                      className="bg-white dark:bg-slate-950 border-amber-200 mt-2 h-11"
                    />
                  </div>
                )}
              </div>

              {/* 5. DESCRIÇÃO COMPLETA */}
              <div className="pt-4">
                <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2 block">
                  Descrição Completa <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  value={data.ds_descricao}
                  onChange={e => setData("ds_descricao", e.target.value)}
                  rows={6}
                  className={cn(
                    "resize-none text-[15px] p-5 leading-relaxed shadow-inner transition-colors",
                    localErrors.ds_descricao
                      ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 focus-visible:ring-rose-500"
                      : "bg-slate-50 dark:bg-[#151c2c] border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
                  )}
                  placeholder="Descreva o problema ou solicitação com o máximo de detalhes (mensagens de erro, passos que executou, etc)..."
                />
                {localErrors.ds_descricao && (
                  <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {localErrors.ds_descricao}
                  </p>
                )}
              </div>

              {/* 6. UPLOAD DE ARQUIVOS + CTRL V */}
              <div className="pt-2 pb-4">
                <label className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 block flex items-center justify-between">
                  Anexos (Opcional)
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Máx. 5 ficheiros</span>
                </label>

                <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-10 text-center bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors relative group">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-8 h-8 text-indigo-500" />
                    </div>
                    <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 tracking-tight">
                      Clique para anexar ficheiros
                    </span>
                    <div className="flex flex-col items-center mt-3 gap-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Ou pressione <kbd className="bg-white dark:bg-slate-800 border px-2 py-0.5 rounded-md mx-1 shadow-sm font-sans font-bold text-slate-700 dark:text-slate-300">Ctrl + V</kbd> em qualquer lugar da tela
                      </span>
                      <span className="text-xs text-slate-400 mt-1">Formatos suportados: Imagens, PDF, DOC</span>
                    </div>
                  </label>
                </div>

                {/* Previews das Imagens */}
                {data.arquivos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6 animate-in fade-in slide-in-from-bottom-2">
                    {data.arquivos.map((file, index) => {
                      const isImage = file.type.startsWith("image/");
                      return (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm aspect-square flex flex-col items-center justify-center p-2">
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {isImage ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover absolute inset-0" />
                          ) : (
                            <>
                              <FileIcon className="w-8 h-8 text-indigo-500 mb-2" />
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center truncate w-full px-1">{file.name}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </CardContent>

            {/* FOOTER - BOTÃO ENVIAR */}
            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-slate-500 font-medium hidden sm:block">
                Verifique os dados antes de enviar.
              </span>
              <Button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold h-14 px-10 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all text-base"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                Abrir Solicitação
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}