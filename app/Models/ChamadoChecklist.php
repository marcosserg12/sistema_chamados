<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChamadoChecklist extends Model
{
    protected $table = 'tb_chamado_checklists';
    protected $primaryKey = 'id_checklist';
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'st_concluido' => 'boolean',
        'dt_criacao' => 'datetime',
        'dt_update' => 'datetime',
    ];

    public function chamado()
    {
        return $this->belongsTo(Chamado::class, 'id_chamado', 'id_chamado');
    }
}
