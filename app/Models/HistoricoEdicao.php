<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoricoEdicao extends Model
{
    protected $table = 'tb_historico_edicao';
    protected $primaryKey = 'id_historico';
    public $timestamps = false;

    protected $fillable = [
        'id_chamado', 'id_usuario', 'dt_update'
    ];
}