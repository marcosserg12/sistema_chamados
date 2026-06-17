<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPasswordReset
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->st_reset_senha == 1) {
            if (!$request->routeIs('alterar-senha.*', 'logout')) {
                return redirect()->route('alterar-senha.show');
            }
        }

        return $next($request);
    }
}
