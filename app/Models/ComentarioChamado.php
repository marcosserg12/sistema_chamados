<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComentarioChamado extends Model
{
    protected $table = 'tb_comentario_chamado';

    // Se a sua tabela tiver uma Primary Key diferente, ajuste aqui (ex: 'id_comentario')
    protected $primaryKey = 'id';

    public $timestamps = false; // O seu banco usa dt_comentario manualmente

    protected $fillable = [
        'id_chamado', 'id_usuario', 'ds_comentario', 'dt_comentario'
    ];

    public function usuario()
    {
        // Ajuste para User::class se a sua model de usuário for User
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}