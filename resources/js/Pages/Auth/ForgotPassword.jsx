import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            eyebrow="Recuperar acesso"
            title="Esqueceu sua senha?"
            subtitle="Informe o e-mail cadastrado e enviaremos um link para você definir uma nova senha."
        >
            <Head title="Recuperar Senha" />

            {status && (
                <div className="mb-5 flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="email" value="E-mail" />

                    <div className="relative mt-1.5">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="pl-10 h-12 w-full"
                            placeholder="voce@empresa.com.br"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <PrimaryButton className="w-full justify-center h-12" disabled={processing}>
                    {processing
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                        : 'Enviar link de recuperação'
                    }
                </PrimaryButton>

                <Link
                    href={route('login')}
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o login
                </Link>
            </form>
        </GuestLayout>
    );
}
