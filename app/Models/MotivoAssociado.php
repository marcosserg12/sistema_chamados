<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MotivoAssociado extends Model
{
    protected $table = 'tb_motivo_associado';
    protected $primaryKey = 'id_motivo_associado';
    public $timestamps = false;

    protected $fillable = ['id_motivo_principal', 'ds_descricao_motivo', 'id_empresa', 'st_ativo'];

    public function motivoPrincipal()
    {
        return $this->belongsTo(MotivoPrincipal::class, 'id_motivo_principal', 'id_motivo_principal');
    }

    // Opcional: Se quiser mostrar o nome da empresa
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }
}