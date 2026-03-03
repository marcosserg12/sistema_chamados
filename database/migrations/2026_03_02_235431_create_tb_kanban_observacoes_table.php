<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_kanban_observacoes', function (Blueprint $table) {
            $table->id('id_observacao');
            $table->integer('id_chamado');
            $table->integer('id_usuario');
            $table->text('ds_observacao');
            $table->timestamp('dt_criacao')->useCurrent();
            $table->timestamp('dt_update')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_kanban_observacoes');
    }
};
