<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_usuario_laravel', function (Blueprint $blueprint) {
            $blueprint->string('ds_foto')->nullable()->after('ds_email');
        });
    }

    public function down(): void
    {
        Schema::table('tb_usuario_laravel', function (Blueprint $blueprint) {
            $blueprint->dropColumn('ds_foto');
        });
    }
};
