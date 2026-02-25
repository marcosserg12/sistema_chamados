<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_chat_tecnico', function (Blueprint $table) {
            $table->id();
            $table->integer('id_usuario'); // Quem enviou
            $table->text('ds_mensagem');
            $table->string('ds_caminho_arquivo')->nullable();
            $table->timestamp('dt_envio')->useCurrent();
            
            $table->index('id_usuario');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_chat_tecnico');
    }
};
