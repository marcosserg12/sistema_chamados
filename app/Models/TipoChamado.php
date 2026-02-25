<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoChamado extends Model
{
    protected $table = 'tb_tipo_chamado';
    protected $primaryKey = 'id_tipo_chamado';
    public $timestamps = false;

    protected $fillable = ['ds_tipo_chamado', 'st_ativo'];

    public function motivos()
    {
        return $this->hasMany(MotivoPrincipal::class, 'id_tipo_chamado', 'id_tipo_chamado');
    }
}