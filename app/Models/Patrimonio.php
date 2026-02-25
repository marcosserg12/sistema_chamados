<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patrimonio extends Model
{
    protected $table = 'tb_patrimonio';
    protected $primaryKey = 'id_patrimonio';
    public $timestamps = false;

    protected $fillable = [
        'ds_codigo',
        'id_tipo_produto',
        'ds_marca',
        'ds_modelo',
        'ds_num_serie',
        'id_empresa',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    public function tipo()
    {
        return $this->belongsTo(TipoProduto::class, 'id_tipo_produto', 'id_tipo_produto');
    }
}