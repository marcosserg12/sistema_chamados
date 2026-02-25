<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RelacaoChamadoUsuario extends Model
{
    protected $table = 'rl_chamado_usuario';
    public $timestamps = false;

    // Liberar as colunas para o Laravel gravar
    protected $fillable = ['id_chamado', 'id_usuario', 'dt_aceito'];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}