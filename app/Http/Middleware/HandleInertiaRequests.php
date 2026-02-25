<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id_usuario' => $request->user()->id_usuario,
                    'ds_nome' => $request->user()->ds_nome,
                    'ds_email' => $request->user()->ds_email,
                    'ds_usuario' => $request->user()->ds_usuario,
                    'id_perfil' => $request->user()->id_perfil,
                    'nu_telefone' => $request->user()->nu_telefone,
                    'ds_foto' => $request->user()->ds_foto,
                    'preferencias' => $request->user()->preferencias,
                ] : null,
            ],
            // 👇 ADICIONE ESTE BLOCO FLASH AQUI 👇
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'success_password' => fn () => $request->session()->get('success_password'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
