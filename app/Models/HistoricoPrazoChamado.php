<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoricoPrazoChamado extends Model
{
    protected $table = 'tb_historico_prazo_chamado';
    protected $primaryKey = 'id_historico';
    public $timestamps = false;

    protected $fillable = [
        'id_chamado', 'id_usuario', 'dt_prazo_anterior', 'dt_prazo_novo', 'ds_justificativa', 'dt_update',
    ];

    protected $casts = [
        'dt_prazo_anterior' => 'date:Y-m-d',
        'dt_prazo_novo' => 'date:Y-m-d',
        'dt_update' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Frase que aparece no histórico unificado do chamado.
     */
    public function descricao(): string
    {
        $novo = $this->dt_prazo_novo?->format('d/m/Y');
        $anterior = $this->dt_prazo_anterior?->format('d/m/Y');

        if (!$novo) {
            return 'Prazo de entrega removido (chamado reaberto)';
        }
        if (!$anterior) {
            return "Prazo de entrega definido para {$novo}";
        }
        if (!$this->ds_justificativa) {
            return "Prazo de entrega redefinido para {$novo} ao reabrir o chamado (antes: {$anterior})";
        }

        return "Prazo de entrega alterado de {$anterior} para {$novo}. Justificativa: {$this->ds_justificativa}";
    }
}
