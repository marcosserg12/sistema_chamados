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
        Schema::table('tb_chamados', function (Blueprint $table) {
            $table->integer('ordem_kanban')->default(0)->after('st_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tb_chamados', function (Blueprint $table) {
            $table->dropColumn('ordem_kanban');
        });
    }
};
