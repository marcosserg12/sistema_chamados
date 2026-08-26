import { Link } from '@inertiajs/react';

export default function GuestLayout({ eyebrow, title, subtitle, children }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans px-4 py-10">

            {/* Ambient Background Glow (mesma linguagem visual do Login) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-indigo-500/10 rounded-full blur-[140px] mix-blend-screen"></div>
            </div>

            <div className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                <div className="bg-white rounded-[2rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/10">

                    <div className="relative h-[110px] w-full bg-slate-50 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 to-transparent"></div>
                        <Link href="/" className="relative z-10">
                            <img
                                src="/images/grupo_ibra.png"
                                alt="Grupo Ibra"
                                className="h-[70px] w-auto object-contain filter drop-shadow-[0_8px_15px_rgba(0,0,0,0.05)]"
                            />
                        </Link>
                    </div>

                    <div className="p-8 sm:p-10">
                        {eyebrow && (
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <span className="h-px w-6 bg-slate-200"></span>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 font-display">{eyebrow}</h2>
                                <span className="h-px w-6 bg-slate-200"></span>
                            </div>
                        )}

                        {title && (
                            <div className="text-center mb-7">
                                <h1 className="text-xl font-bold text-slate-900 font-display">{title}</h1>
                                {subtitle && (
                                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">{subtitle}</p>
                                )}
                            </div>
                        )}

                        {children}
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center gap-3">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
                        Tecnologia MS Soluções &bull; 2026
                    </p>
                    <div className="h-[2px] w-8 bg-blue-600/30 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
