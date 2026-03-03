<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.Usuario.{id}', function ($user, $id) {
    return (int) $user->id_usuario === (int) $id;
});

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id_usuario === (int) $id;
});

// Canal privado para os técnicos
Broadcast::channel('tech-chat', function ($user) {
    // Perfis 1 (Admin), 4 (Técnico), 5 (Superadmin)
    return in_array($user->id_perfil, [1, 4, 5]);
});

// Canal privado específico para o chat de cada chamado
Broadcast::channel('chamado.{chamadoId}', function ($user, $chamadoId) {
    $chamado = \App\Models\Chamado::find($chamadoId);
    if (!$chamado) {
        return false;
    }

    $isSolicitante = $user->id_usuario == $chamado->id_usuario;
    $isTecnicoResponsavel = \Illuminate\Support\Facades\DB::table('rl_chamado_usuario')
        ->where('id_chamado', $chamadoId)
        ->where('id_usuario', $user->id_usuario)
        ->exists();
    $isAdmin = in_array($user->id_perfil, [1, 5]);

    return $isSolicitante || $isTecnicoResponsavel || $isAdmin;
});
