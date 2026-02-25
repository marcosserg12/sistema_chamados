<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    // Permite preenchimento em massa

    protected $table = 'tb_empresa';
    protected $primaryKey = 'id_empresa';
    protected $fillable = [
        'ds_empresa',
        'nu_cnpj',
        'ds_endereco',
        'nu_telefone',
        'ds_email',
        'ds_responsavel',
        'st_status'
    ];

    // Relacionamento: Uma Empresa tem MUITOS Chamados
    public function chamados(): HasMany
    {
        return $this->hasMany(Chamado::class);
    }

    // Relacionamento: Uma Empresa tem MUITOS Patrimônios (Hardware)
    public function patrimonios(): HasMany
    {
        return $this->hasMany(Patrimonio::class);
    }
    public function localizacoes()
    {
        return $this->belongsToMany(
            Localizacao::class,
            'rl_empresa_localizacao', // Nome da tabela pivô que liga empresa e local
            'id_empresa',             // Chave da Empresa na pivô
            'id_localizacao'          // Chave da Localização na pivô
        );
    }
}
