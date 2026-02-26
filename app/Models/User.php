<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'tb_usuario_laravel';
    protected $primaryKey = 'id_usuario';

    // Nomes das colunas de data do seu banco
    const CREATED_AT = 'dt_insert';
    const UPDATED_AT = 'dt_update';

    protected $fillable = [
        'ds_usuario', 'ds_nome', 'ds_email', 'ds_foto', 'nu_telefone', 'ds_senha', 'st_ativo', 'id_perfil', 'preferencias'
    ];

    protected $casts = [
    'email_verified_at' => 'datetime',
    'password' => 'hashed',
    'preferencias' => 'array', // <--- IMPORTANTE
];

    protected $hidden = [
        'ds_senha',
    ];

    // O Laravel precisa saber qual coluna é a senha para o Auth::attempt
    public function getAuthPassword()
    {
        return $this->ds_senha;
    }

    // Se você usa e-mail para logar, o Laravel precisa saber disso
    public function getEmailForPasswordReset()
    {
        return $this->ds_email;
    }

    /**
     * Define o destinatário para as notificações de e-mail.
     */
    public function routeNotificationForMail($notification)
    {
        return $this->ds_email;
    }

    public function empresas()
    {
        return $this->belongsToMany(Empresa::class, 'rl_usuario_empresa_localizacao', 'id_usuario', 'id_empresa');
    }

    /**
     * Boot do modelo para definir valores padrão.
     */
    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->preferencias)) {
                if (in_array($user->id_perfil, [1, 4, 5])) {
                    $user->preferencias = [
                        "dark_mode" => false,
                        "menu_compacto" => false,
                        "canal_whatsapp" => true,
                        "canal_email" => true,
                        "canal_navegador" => true,
                        "notificacao_som" => true,
                        "evt_chat_chamado" => true,
                        "evt_novo_chamado" => true,
                        "evt_resumo_diario" => true,
                        "evt_edicao_chamado" => true,
                        "evt_novo_comentario" => true,
                        "evt_chamado_atribuido" => true,
                        "evt_mudanca_status" => true,
                        "id_empresa_padrao" => null,
                        "id_localizacao_padrao" => null,
                        "senha_alterada" => false
                    ];
                } else {
                    $user->preferencias = [
                        "dark_mode" => false,
                        "menu_compacto" => false,
                        "canal_whatsapp" => true,
                        "canal_email" => true,
                        "canal_navegador" => true,
                        "notificacao_som" => true,
                        "evt_chat_chamado" => true,
                        "evt_novo_chamado" => false,
                        "evt_resumo_diario" => false,
                        "evt_edicao_chamado" => true,
                        "evt_novo_comentario" => true,
                        "evt_chamado_atribuido" => false,
                        "evt_mudanca_status" => true,
                        "id_empresa_padrao" => null,
                        "id_localizacao_padrao" => null,
                        "senha_alterada" => false
                    ];
                }
            }
        });
    }
}
