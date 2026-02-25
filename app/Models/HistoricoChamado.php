<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoricoChamado extends Model
{
    protected $table = 'tb_historico_chamado'; // Nome correto da tabela antiga
    protected $primaryKey = 'id_historico';
    public $timestamps = false; // Como o banco antigo usa dt_evento

    protected $fillable = [
        'id_chamado', 'id_usuario', 'ds_historico',
        'ds_comentario', 'origem', 'st_status', 'dt_evento'
    ];

    public function chamado(): BelongsTo
    {
        return $this->belongsTo(Chamado::class, 'id_chamado', 'id_chamado');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}