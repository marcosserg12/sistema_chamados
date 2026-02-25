import React, { useEffect } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Lock, Hexagon, AlertCircle } from "lucide-react";

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        ds_email: '',
        ds_senha: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('ds_senha');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50/80 p-4 font-sans">
            <Head title="Login - MS Soluções" />

            <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">

                {/* Cabeçalho */}
                <div className="bg-blue-600 px-8 pt-10 pb-8 text-center relative rounded-b-[40px] shadow-sm z-10">
                    <div className="bg-white rounded-full px-6 py-3 inline-flex items-center justify-center shadow-md mb-4">
                         <div className="flex items-center gap-2">
                            <Hexagon className="text-blue-600 fill-blue-600 w-6 h-6" />
                            <span className="text-lg font-bold text-slate-800 tracking-tight">MS<span className="font-light">Soluções</span></span>
                         </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">Bem-vindo</h2>
                    <p className="text-blue-100 text-sm opacity-90">Insira suas credenciais</p>
                </div>

                <div className="px-8 py-8">
                    <form onSubmit={submit} className="space-y-5">

                        {/* Campo Usuário */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ds_email" className={errors.ds_email ? "text-red-500" : "text-slate-600"}>
                                Usuário
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-3 top-3 transition-colors ${errors.ds_email ? "text-red-400" : "text-slate-400 group-focus-within:text-blue-600"}`}>
                                    <User className="h-5 w-5" />
                                </div>
                                <Input
                                    id="ds_email"
                                    type="text"
                                    placeholder="Digite seu usuário"
                                    // AQUI: Borda vermelha se tiver erro
                                    className={`pl-10 h-11 transition-all ${
                                        errors.ds_email
                                        ? "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30 text-red-900 placeholder:text-red-300"
                                        : "bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                                    value={data.ds_email}
                                    onChange={e => setData('ds_email', e.target.value)}
                                />
                            </div>
                            {/* Mensagem de erro bonita */}
                            {errors.ds_email && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-red-500 animate-in slide-in-from-left-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <p className="text-xs font-medium">{errors.ds_email}</p>
                                </div>
                            )}
                        </div>

                        {/* Campo Senha */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ds_senha" className="text-slate-600">Senha</Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="ds_senha"
                                    type="password"
                                    placeholder="Digite sua senha"
                                    className="pl-10 h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-100 transition-all"
                                    value={data.ds_senha}
                                    onChange={e => setData('ds_senha', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                             <input
                                type="checkbox"
                                id="remember"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                             />
                            <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">
                                Lembrar-me
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all mt-2"
                            disabled={processing}
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">© 2026 MS Soluções Digitais</p>
                    </div>
                </div>
            </div>
        </div>
    );
}