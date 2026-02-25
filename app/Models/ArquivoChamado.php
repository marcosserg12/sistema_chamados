<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArquivoChamado extends Model
{
    // Nome exato da tabela no seu banco de dados
    protected $table = 'rl_arquivo_chamado';

    // Chave primária baseada na imagem
    protected $primaryKey = 'id_arquivo';

    // Se a tabela não tiver colunas created_at e updated_at
    public $timestamps = false;

    protected $fillable = [
        'id_chamado',
        'ds_caminho_arquivo'
    ];

    /**
     * Relacionamento com o Chamado
     */
    public function chamado(): BelongsTo
    {
        return $this->belongsTo(Chamado::class, 'id_chamado', 'id_chamado');
    }
}