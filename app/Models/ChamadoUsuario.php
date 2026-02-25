<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChamadoUsuario extends Model
{
    // 1. Especificar o nome da tabela intermediária do seu banco antigo
    protected $table = 'rl_chamado_usuario';

    // 2. Desativar timestamps caso a tabela RL não tenha colunas 'created_at' e 'updated_at'
    public $timestamps = false;

    // 3. Definir as colunas que podem ser preenchidas
    protected $fillable = [
        'id_chamado',
        'id_usuario',
        'dt_aceito'
    ];

    /**
     * Relacionamento com o Chamado
     */
    public function chamado(): BelongsTo
    {
        return $this->belongsTo(Chamado::class, 'id_chamado', 'id_chamado');
    }

    /**
     * Relacionamento com o Usuário (Técnico)
     */
    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}