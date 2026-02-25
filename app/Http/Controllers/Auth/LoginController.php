<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'ds_email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Mapeamos o campo 'password' do formulário para 'ds_senha' do banco
        if (Auth::attempt(['ds_email' => $credentials['ds_email'], 'password' => $credentials['password'], 'st_ativo' => 'A'])) {
            $request->session()->regenerate();
            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'ds_email' => 'As credenciais fornecidas não correspondem aos nossos registros ou o usuário está inativo.',
        ])->onlyInput('ds_email');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}