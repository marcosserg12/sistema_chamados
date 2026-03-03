<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KanbanObservacao extends Model
{
    protected $table = 'tb_kanban_observacoes';
    protected $primaryKey = 'id_observacao';
    public $timestamps = false;

    protected $fillable = [
        'id_chamado', 'id_usuario', 'ds_observacao', 'dt_criacao', 'dt_update'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    public function chamado()
    {
        return $this->belongsTo(Chamado::class, 'id_chamado', 'id_chamado');
    }
}
