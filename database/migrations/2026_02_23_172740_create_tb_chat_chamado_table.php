<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_chat_chamado', function (Blueprint $table) {
            $table->id();
            $table->integer('id_chamado');
            $table->integer('id_usuario');
            $table->text('ds_mensagem')->nullable();
            $table->string('ds_caminho_arquivo')->nullable();
            $table->timestamp('dt_envio')->useCurrent();
            
            // Índices para performance
            $table->index('id_chamado');
            $table->index('id_usuario');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_chat_chamado');
    }
};
