import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            eyebrow="Área protegida"
            title="Confirme sua senha"
            subtitle="Por segurança, confirme sua senha antes de continuar nesta área."
        >
            <Head title="Confirmar Senha" />

            <div className="flex items-center gap-3 mb-6 text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                Esta é uma área protegida do sistema.
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="password" value="Senha" />

                    <div className="relative mt-1.5">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="pl-10 h-12 w-full"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <PrimaryButton className="w-full justify-center h-12" disabled={processing}>
                    {processing
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirmando...</>
                        : 'Confirmar'
                    }
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
