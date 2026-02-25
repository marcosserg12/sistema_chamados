<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoProduto extends Model
{
    protected $table = 'tb_tipo_produto';

    protected $primaryKey = 'id_tipo_produto';

    protected $fillable = ['ds_produto'];

    public function patrimonios(): HasMany
    {
        return $this->hasMany(Patrimonio::class, 'id_tipo_produto', 'id_tipo_produto');
    }
}