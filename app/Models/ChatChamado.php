<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatChamado extends Model
{
    protected $table = 'tb_chat_chamado';
    public $timestamps = false;

    protected $fillable = [
        'id_chamado',
        'id_usuario',
        'ds_mensagem',
        'ds_caminho_arquivo',
        'dt_envio',
        'dt_leitura'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}
