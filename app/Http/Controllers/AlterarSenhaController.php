<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AlterarSenhaController extends Controller
{
    public function show()
    {
        return Inertia::render('AlterarSenha');
    }

    public function update(Request $request)
    {
        $request->validate([
            'senha' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'senha.required' => 'A nova senha é obrigatória.',
            'senha.min' => 'A senha deve ter no mínimo 6 caracteres.',
            'senha.confirmed' => 'A confirmação de senha não coincide.',
        ]);

        $user = $request->user();

        $user->update([
            'ds_senha' => Hash::make($request->senha),
            'st_reset_senha' => 0,
        ]);

        return redirect()->route('dashboard');
    }
}
