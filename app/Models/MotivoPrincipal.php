<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MotivoPrincipal extends Model
{
    protected $table = 'tb_motivo_principal';
    protected $primaryKey = 'id_motivo_principal';
    public $timestamps = false;

    protected $fillable = ['ds_descricao', 'id_tipo_chamado', 'st_ativo'];

    public function tipo()
    {
        return $this->belongsTo(TipoChamado::class, 'id_tipo_chamado', 'id_tipo_chamado');
    }

    public function associados()
    {
        return $this->hasMany(MotivoAssociado::class, 'id_motivo_principal', 'id_motivo_principal');
    }
}