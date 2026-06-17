import React from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";

export default function AlterarSenha() {
    const { data, setData, post, processing, errors } = useForm({
        senha: '',
        senha_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/alterar-senha');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
            <Head title="Alterar Senha" />

            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Troca de Senha Obrigatória</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2">
                            Por segurança, defina uma nova senha antes de continuar.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <Label htmlFor="senha" className="text-slate-700 dark:text-slate-300 font-medium">
                                Nova Senha
                            </Label>
                            <div className="relative mt-1.5">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="senha"
                                    type="password"
                                    value={data.senha}
                                    onChange={e => setData('senha', e.target.value)}
                                    className="pl-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                                    placeholder="Mínimo 6 caracteres"
                                    autoFocus
                                />
                            </div>
                            {errors.senha && (
                                <p className="text-red-500 text-xs mt-1">{errors.senha}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="senha_confirmation" className="text-slate-700 dark:text-slate-300 font-medium">
                                Confirmar Nova Senha
                            </Label>
                            <div className="relative mt-1.5">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="senha_confirmation"
                                    type="password"
                                    value={data.senha_confirmation}
                                    onChange={e => setData('senha_confirmation', e.target.value)}
                                    className="pl-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                                    placeholder="Repita a nova senha"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 mt-2"
                        >
                            {processing
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                                : <><KeyRound className="w-4 h-4 mr-2" /> Definir Nova Senha</>
                            }
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
