<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Localizacao extends Model
{
    protected $table = 'tb_localizacao';
    protected $primaryKey = 'id_localizacao';
    public $timestamps = false;

    protected $fillable = [
        'ds_localizacao',
        'st_ativo' // Assumindo que você queira controle de status
    ];

       public function empresas()
       {
           return $this->belongsToMany(
               Empresa::class,
               'rl_empresa_localizacao',
               'id_localizacao',
               'id_empresa'
           );
       }
   
       public function usuarios()
       {
           return $this->belongsToMany(
               User::class,
               'rl_usuario_empresa_localizacao',
               'id_localizacao',
               'id_usuario'
           );
       }
   }
   