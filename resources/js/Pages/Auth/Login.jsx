import React, { useEffect } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Loader2, User, Lock, AlertCircle } from "lucide-react";

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
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
        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans">
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[8s]"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-indigo-500/15 rounded-full blur-[140px] mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-40"></div>
            </div>

            <Head title="Acesso ao Sistema | Ibra" />

            <div className="w-full max-w-[460px] px-5 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
                
                {/* Card Principal */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/10">
                    
                    {/* Header Integrado para a Logo */}
                    <div className="relative h-[160px] w-full bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
                        
                        <div className="absolute top-[-50%] left-[-10%] w-[120%] h-full bg-gradient-to-b from-blue-50/80 to-transparent rotate-[-4deg] transform origin-top-left transition-transform duration-1000 hover:rotate-[-2deg]"></div>
                        <div className="absolute top-[-40%] right-[-15%] w-[80%] h-full bg-gradient-to-b from-indigo-50/50 to-transparent rotate-[8deg] transform origin-top-right blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
                        
                        <div className="relative z-10 flex flex-col items-center transform transition-transform hover:scale-105 duration-700 ease-out">
                            <img 
                                src="/images/grupo_ibra.png" 
                                alt="Grupo Ibra" 
                                className="h-[110px] w-auto object-contain filter drop-shadow-[0_8px_15px_rgba(0,0,0,0.05)]" 
                            />
                        </div>
                    </div>

                    {/* Formulário */}
                    <div className="p-10 sm:p-12 pt-4 bg-white">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <span className="h-[1px] w-8 bg-slate-200"></span>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Portal de Acesso</h2>
                            <span className="h-[1px] w-8 bg-slate-200"></span>
                        </div>
                        
                        <form onSubmit={submit} className="space-y-7">
                            
                            <div className="space-y-2.5">
                                <Label htmlFor="login" className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.15em] ml-1">
                                    Identificação do Usuário
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="login"
                                        type="text"
                                        placeholder="Usuário ou e-mail"
                                        className={`pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 font-medium transition-all duration-300 focus:bg-white focus:ring-[4px] focus:ring-blue-50 focus:border-blue-500 hover:bg-slate-100 focus:hover:bg-white ${
                                            errors.login ? "border-red-300 focus:ring-red-100 focus:border-red-500 bg-red-50" : ""
                                        }`}
                                        value={data.login}
                                        onChange={e => setData('login', e.target.value)}
                                    />
                                </div>
                                {errors.login && (
                                    <p className="text-red-500 text-[11px] font-bold mt-2 flex items-center gap-1.5 ml-1 animate-in fade-in">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.login}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="ds_senha" className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.15em] ml-1">
                                    Senha de Acesso
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="ds_senha"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 font-medium transition-all duration-300 focus:bg-white focus:ring-[4px] focus:ring-blue-50 focus:border-blue-500 hover:bg-slate-100 focus:hover:bg-white"
                                        value={data.ds_senha}
                                        onChange={e => setData('ds_senha', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 bg-slate-50 checked:bg-blue-600 checked:border-blue-600 transition-all duration-300"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                        />
                                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-transform duration-300 scale-50 peer-checked:scale-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">Manter acesso conectado</span>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-15 bg-[#020617] hover:bg-blue-600 text-white text-[15px] font-black rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.4)] transition-all duration-500 transform active:scale-[0.97] flex items-center justify-center gap-3 overflow-hidden relative group"
                                disabled={processing}
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                                {processing ? (
                                    <Loader2 className="h-6 w-6 animate-spin relative z-10" />
                                ) : (
                                    <span className="relative z-10 tracking-[0.1em]">ACESSAR PORTAL</span>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-3">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
                        Tecnologia MS Soluções &bull; 2026
                    </p>
                    <div className="h-[2px] w-8 bg-blue-600/30 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
