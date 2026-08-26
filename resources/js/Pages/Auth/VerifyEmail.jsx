import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { MailCheck, Loader2, CheckCircle2, LogOut } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout
            eyebrow="Um passo antes de começar"
            title="Confirme seu e-mail"
            subtitle="Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar sua conta."
        >
            <Head title="Verificar E-mail" />

            <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <MailCheck className="w-7 h-7 text-blue-600" />
                </div>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-5 flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Um novo link de confirmação foi enviado para o e-mail cadastrado.
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-3">
                <PrimaryButton className="w-full justify-center h-12" disabled={processing}>
                    {processing
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                        : 'Reenviar e-mail de confirmação'
                    }
                </PrimaryButton>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors py-2"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </Link>
            </form>
        </GuestLayout>
    );
}
