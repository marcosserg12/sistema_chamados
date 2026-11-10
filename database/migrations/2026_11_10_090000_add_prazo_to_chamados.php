<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Prazo de entrega do chamado (só data) + histórico de mudanças de prazo.
 *
 * Substitui a antiga "previsão de término" do Kanban (dt_previsao_termino,
 * opcional e praticamente sem uso): o valor que existir é copiado para o
 * dt_prazo e a coluna antiga sai.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_chamados', function (Blueprint $table) {
            $table->date('dt_prazo')->nullable();
            // Último dia em que o chamado entrou no lembrete diário (evita repetir no mesmo dia).
            $table->date('dt_lembrete_prazo')->nullable();
            $table->index(['st_status', 'dt_prazo'], 'idx_chamados_status_prazo');
        });

        if (Schema::hasColumn('tb_chamados', 'dt_previsao_termino')) {
            DB::table('tb_chamados')
                ->whereNotNull('dt_previsao_termino')
                ->update(['dt_prazo' => DB::raw('DATE(dt_previsao_termino)')]);

            Schema::table('tb_chamados', function (Blueprint $table) {
                $table->dropColumn('dt_previsao_termino');
            });
        }

        Schema::create('tb_historico_prazo_chamado', function (Blueprint $table) {
            $table->increments('id_historico');
            $table->integer('id_chamado')->index();
            $table->integer('id_usuario')->nullable();
            $table->date('dt_prazo_anterior')->nullable();
            $table->date('dt_prazo_novo')->nullable(); // null = prazo removido (chamado reaberto)
            $table->text('ds_justificativa')->nullable();
            $table->dateTime('dt_update');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_historico_prazo_chamado');

        Schema::table('tb_chamados', function (Blueprint $table) {
            $table->dateTime('dt_previsao_termino')->nullable();
        });

        DB::table('tb_chamados')
            ->whereNotNull('dt_prazo')
            ->update(['dt_previsao_termino' => DB::raw('dt_prazo')]);

        Schema::table('tb_chamados', function (Blueprint $table) {
            $table->dropIndex('idx_chamados_status_prazo');
            $table->dropColumn(['dt_prazo', 'dt_lembrete_prazo']);
        });
    }
};
