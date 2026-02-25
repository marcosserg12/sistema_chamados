<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoricoUsuarioChamado extends Model
{
    protected $table = 'tb_historico_usuario_chamado';
    protected $primaryKey = 'id_historico';
    public $timestamps = false;

    // Mantive a grafia exata do seu banco de dados (desginado)
    protected $fillable = [
        'id_chamado', 'id_usuario_adm', 'id_usuario_desginado', 'dt_update'
    ];
}