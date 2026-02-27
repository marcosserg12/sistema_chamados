<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Chamado extends Model
{
    // Se a sua tabela ainda se chamar tb_chamados, especifique aqui:
    protected $table = 'tb_chamados';

    // Primary Key personalizada caso não seja apenas 'id'
    protected $primaryKey = 'id_chamado';

    public $timestamps = true;
    const CREATED_AT = 'dt_data_chamado'; // Ensina qual é a coluna de criação
    const UPDATED_AT = 'dt_update';

    protected $guarded = [];

    /**
     * Relacionamento com o Solicitante
     */
    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Relacionamento com o Técnico Responsável através da tabela pivot
     */
    public function tecnico(): HasOneThrough
    {
        return $this->hasOneThrough(
            Usuario::class,
            RelacaoChamadoUsuario::class,
            'id_chamado', 
            'id_usuario', 
            'id_chamado', 
            'id_usuario'  
        );
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    public function localizacao(): BelongsTo
    {
        return $this->belongsTo(Localizacao::class, 'id_localizacao', 'id_localizacao');
    }

    public function tipoChamado(): BelongsTo
    {
        return $this->belongsTo(TipoChamado::class, 'id_tipo_chamado', 'id_tipo_chamado');
    }

    public function motivoPrincipal(): BelongsTo
    {
        return $this->belongsTo(MotivoPrincipal::class, 'id_motivo_principal', 'id_motivo_principal');
    }

    public function motivoAssociado(): BelongsTo
    {
        return $this->belongsTo(MotivoAssociado::class, 'id_motivo_associado', 'id_motivo_associado');
    }

    public function historicosStatus(): HasMany
    {
        return $this->hasMany(HistoricoStatusChamado::class, 'id_chamado', 'id_chamado');
    }

    public function anexos(): HasMany
    {
        return $this->hasMany(ArquivoChamado::class, 'id_chamado', 'id_chamado');
    }

    /**
     * Scope para o Dashboard: Regra restrita de visibilidade (Meus + Abertos para técnicos)
     */
    public function scopeVisivelNoDashboard($query, $user)
    {
        $id_perfil = $user->id_perfil;
        $id_usuario = $user->id_usuario;

        // Super Admin (5): Vê tudo
        if ($id_perfil == 5) {
            return $query;
        }

        // Administrador (1) ou Técnico (4): Vê atribuídos a ele OU status Aberto (0)
        if ($id_perfil == 1 || $id_perfil == 4) {
            return $query->where(function ($q) use ($id_usuario) {
                $q->whereHas('relacionamentoUsuarios', function ($qr) use ($id_usuario) {
                    $qr->where('id_usuario', $id_usuario);
                })->orWhere('tb_chamados.st_status', 0);
            });
        }

        // Gestor (3): vê chamados das localizações que ele gerencia
        if ($id_perfil == 3) {
            return $query->whereHas('localizacao.usuarios', function ($q) use ($id_usuario) {
                $q->where('tb_usuario_laravel.id_usuario', $id_usuario);
            });
        }

        // Usuário comum (2): vê apenas o que ele mesmo abriu
        return $query->where('tb_chamados.id_usuario', $id_usuario);
    }

    /**
     * Scope para aplicar as regras de visibilidade baseadas no perfil (Geral/Listagem)
     */
    public function scopeVisivelPara($query, $user)
    {
        // Administradores e Técnicos (1, 4, 5) - Vêem TUDO
        if (in_array($user->id_perfil, [1, 4, 5])) {
            return $query;
        }

        // Gestor (3): vê chamados das localizações que ele gerencia
        if ($user->id_perfil == 3) {
            return $query->whereHas('localizacao.usuarios', function ($q) use ($user) {
                $q->where('tb_usuario_laravel.id_usuario', $user->id_usuario);
            });
        }

        // Usuário comum (2): vê apenas o que ele mesmo abriu ou onde é parte
        return $query->where(function ($q) use ($user) {
            $q->where('tb_chamados.id_usuario', $user->id_usuario)
              ->orWhereHas('relacionamentoUsuarios', function($qr) use ($user) {
                  $qr->where('id_usuario', $user->id_usuario);
              });
        });
    }

    /**
     * Scope para aplicar filtros dinâmicos
     */
    public function scopeFiltrar($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($q, $search) {
            $q->where(function ($sq) use ($search) {
                $sq->where('tb_chamados.ds_titulo', 'like', "%{$search}%")
                   ->orWhere('tb_chamados.id_chamado', 'like', "%{$search}%");
            });
        });

        if (isset($filters['status']) && $filters['status'] !== 'todos') {
            $query->where('tb_chamados.st_status', $filters['status']);
        }

        $query->when($filters['tecnico'] ?? null, function ($q, $tecnico) {
            if ($tecnico !== 'todos') {
                $q->whereHas('relacionamentoUsuarios', function ($sq) use ($tecnico) {
                    $sq->where('id_usuario', $tecnico);
                });
            }
        });

        $query->when($filters['localizacao'] ?? null, function ($q, $localizacao) {
            if ($localizacao !== 'todos') {
                $q->where('tb_chamados.id_localizacao', $localizacao);
            }
        });

        return $query;
    }

    public function relacionamentoUsuarios()
    {
        return $this->hasMany(RelacaoChamadoUsuario::class, 'id_chamado', 'id_chamado');
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatChamado::class, 'id_chamado', 'id_chamado');
    }

    // Aliases para compatibilidade com códigos legados
    public function usuarioSolicitante() { return $this->solicitante(); }
    public function tecnicoResponsavel() { return $this->tecnico(); }
}
