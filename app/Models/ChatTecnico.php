<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatTecnico extends Model
{
    protected $table = 'tb_chat_tecnico';
    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'ds_mensagem',
        'ds_caminho_arquivo',
        'dt_envio'
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}
