<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoricoStatusChamado extends Model
{
    protected $table = 'tb_historico_status_chamado';
    protected $primaryKey = 'id_historico';
    public $timestamps = false;

    protected $fillable = [
        'id_chamado', 'st_status', 'id_usuario', 'dt_update'
    ];
}