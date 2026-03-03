<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_chamados', function (Blueprint $table) {
            $table->dateTime('dt_previsao_termino')->nullable();
        });

        Schema::create('tb_chamado_checklists', function (Blueprint $table) {
            $table->id('id_checklist');
            $table->unsignedBigInteger('id_chamado');
            $table->string('ds_item');
            $table->boolean('st_concluido')->default(false);
            $table->timestamp('dt_criacao')->useCurrent();
            $table->timestamp('dt_update')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('id_chamado')->references('id_chamado')->on('tb_chamados')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_chamado_checklists');
        Schema::table('tb_chamados', function (Blueprint $table) {
            $table->dropColumn('dt_previsao_termino');
        });
    }
};
