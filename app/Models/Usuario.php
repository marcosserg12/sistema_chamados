<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'tb_usuario_laravel';
    protected $primaryKey = 'id_usuario';
    public $timestamps = false; // Se sua tabela não tiver created_at/updated_at

    protected $fillable = [
        'ds_nome',
        'ds_email',
        'ds_foto',
        'ds_usuario',
        'nu_telefone',
        'ds_senha',
        'id_perfil',
        'st_ativo',
        'preferencias'
    ];
    protected $hidden = [
        'ds_senha',
        'remember_token',
    ];

    protected $casts = [
    'email_verified_at' => 'datetime',
    'password' => 'hashed',
    'preferencias' => 'array', // <--- IMPORTANTE
];

    // O Laravel busca por 'password', avisamos que é 'ds_senha'
    public function getAuthPassword()
    {
        return $this->ds_senha;
    }

    // Relacionamento com Perfil
    public function perfil()
    {
        return $this->belongsTo(Perfil::class, 'id_perfil', 'id_perfil');
    }

    // Relacionamento com Empresas (Muitos para Muitos)
    public function empresas()
    {
        return $this->belongsToMany(Empresa::class, 'rl_usuario_empresa_localizacao', 'id_usuario', 'id_empresa');
    }

    public function localizacoes()
    {
        // Primeiro parâmetro: O Model do destino (Localizacao)
        // Segundo parâmetro: O nome da tabela pivô no banco
        // Terceiro: Chave estrangeira do usuário na pivô
        // Quarto: Chave estrangeira da localização na pivô
        return $this->belongsToMany(
            Localizacao::class,
            'rl_usuario_empresa_localizacao', // Verifique se este é o nome real da sua tabela pivô
            'id_usuario',
            'id_localizacao'
        );
    }
}
