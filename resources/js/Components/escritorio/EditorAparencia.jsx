import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, Save, RotateCcw } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";
import { APARENCIA_PADRAO, OPCOES_APARENCIA } from "./modelos";
import { Foto } from "./PainelPessoa";

const TONS_PELE = ["#f5d0b5", "#e8b896", "#d9a77f", "#c58c63", "#a86f4a", "#8a5636", "#6e432b", "#4b2c1c"];
const CORES_CABELO = ["#0f0b09", "#2a1c14", "#4a2f1d", "#7c4a2a", "#a9773f", "#d6b26e", "#9ca3af", "#e5e7eb"];

const ROTULOS = {
    cabelo: "Cabelo",
    barba: "Barba",
    oculos: "Óculos",
    roupa: "Roupa",
    corpo: "Silhueta",
};

function Paleta({ cores, valor, onChange }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {cores.map((c) => (
                <button
                    key={c}
                    type="button"
                    onClick={() => onChange(c)}
                    className={cn("w-6 h-6 rounded-full border-2 transition", valor === c ? "border-indigo-500 scale-110" : "border-white dark:border-slate-700")}
                    style={{ background: c }}
                    aria-label={c}
                />
            ))}
            <input type="color" value={valor} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent" />
        </div>
    );
}

/**
 * Ajuste do boneco (só Super Admin). Cada mudança já aparece na cena atrás,
 * via onPrevia; Salvar grava em storage/app/escritorio/aparencias.json.
 */
export default function EditorAparencia({ pessoa, onPrevia, onFechar, onSalvo }) {
    // A prévia muda pessoa.aparencia, então guarda a versão de antes de abrir o editor.
    const [inicial] = useState(pessoa.aparencia);
    const original = { ...APARENCIA_PADRAO, ...inicial };
    const [ap, setAp] = useState(original);
    const [salvando, setSalvando] = useState(false);

    const mudar = (campo, valor) => {
        const novo = { ...ap, [campo]: valor };
        setAp(novo);
        onPrevia(novo);
    };

    const cancelar = () => {
        onPrevia(inicial);
        onFechar();
    };

    const salvar = async () => {
        setSalvando(true);
        try {
            const { data } = await axios.put(`/api/escritorio/aparencia/${pessoa.id}`, ap);
            toast.success(`Boneco de ${pessoa.apelido} salvo.`);
            onSalvo(data.aparencia);
        } catch (e) {
            toast.error("Não consegui salvar a aparência.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Foto pessoa={pessoa} className="w-10 h-10" />
                <div className="flex-1">
                    <h2 className="font-bold text-slate-900 dark:text-white">Aparência de {pessoa.apelido}</h2>
                    <p className="text-xs text-slate-500">As mudanças aparecem na hora no boneco.</p>
                </div>
                <button onClick={cancelar} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar">
                    <X className="w-4 h-4" />
                </button>
            </div>
            {pessoa.foto && (
                <img src={pessoa.foto} alt="" className="mx-4 mt-4 h-32 w-32 self-center rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tom de pele</p>
                    <Paleta cores={TONS_PELE} valor={ap.pele} onChange={(v) => mudar("pele", v)} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Cor do cabelo e barba</p>
                    <Paleta cores={CORES_CABELO} valor={ap.corCabelo} onChange={(v) => mudar("corCabelo", v)} />
                </div>
                {Object.entries(OPCOES_APARENCIA).map(([campo, opcoes]) => (
                    <div key={campo}>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{ROTULOS[campo]}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {opcoes.map((o) => (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() => mudar(campo, o)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-medium border transition capitalize",
                                        ap[campo] === o
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                                    )}
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Cor da roupa</p>
                    <Paleta cores={["#1f2937", "#111827", "#475569", "#9ca3af", "#1e3a5f", "#1d4ed8", "#065f46", "#7f1d1d"]} valor={ap.corRoupa} onChange={(v) => mudar("corRoupa", v)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={!!ap.brinco} onChange={(e) => mudar("brinco", e.target.checked)} className="rounded" />
                    Brinco
                </label>
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setAp(original); onPrevia(inicial); }}>
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Desfazer
                </Button>
                <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={salvar} disabled={salvando}>
                    <Save className="w-4 h-4 mr-1.5" /> {salvando ? "Salvando…" : "Salvar"}
                </Button>
            </div>
        </div>
    );
}
