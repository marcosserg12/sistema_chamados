<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rl_chamado_usuario', function (Blueprint $table) {
            $table->integer('ordem_fila')->nullable()->after('dt_aceito')->comment('Ordem de prioridade na fila do tecnico');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rl_chamado_usuario', function (Blueprint $table) {
            $table->dropColumn('ordem_fila');
        });
    }
};
