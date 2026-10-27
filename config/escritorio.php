<?php

/*
|--------------------------------------------------------------------------
| Escritório 3D
|--------------------------------------------------------------------------
|
| Quem aparece no escritório e como é o boneco de cada um. A aparência
| definida aqui é o padrão; o Super Admin pode ajustar pela própria tela
| (botão "Aparência" no painel da pessoa), e o ajuste fica salvo em
| storage/app/escritorio/aparencias.json, por cima destes valores.
|
| Campos da aparência:
|   pele       cor hex
|   cabelo     curto | topete | ondulado | cacheado | crespo | longo | coque | raspado | careca
|   corCabelo  cor hex
|   barba      nenhuma | bigode | cavanhaque | curta | cheia
|   oculos     nenhum | redondo | quadrado | escuro
|   brinco     true/false
|   roupa      camiseta | moletom | polo | social | terno
|   corRoupa   cor hex
|   corpo      reto | curvo
|
*/

return [

    // Renato Lima (Super Admin): fica na sala de vidro e faz a ronda pelas baias.
    'chefe' => 47,

    // Perfis que ganham baia (4 = Técnico) e ajustes manuais por id de usuário.
    'perfis_com_baia' => [4],
    'incluir' => [],
    'ocultar' => [54], // "Usuario Adm", conta genérica

    // Pessoal de infraestrutura: fica na área dos racks, separada das baias de desenvolvimento.
    'infra' => [41], // Jeliel Sbalqueiro

    // Quem senta junto: cada lista é uma fileira de baias (a primeira é a do
    // fundo), até 4 por fileira, em ordem alfabética na fileira. Quem não
    // estiver aqui ocupa as vagas que sobrarem.
    'fileiras' => [
        [48, 49],     // Eduardo, Kevin
        [43, 23, 45], // João, Marcos, Matheus
    ],

    // Chamado pendente há mais tempo que isso acende o alerta na baia.
    'horas_atraso' => 48,

    // Fila acima disso deixa a baia "sobrecarregada" (pilha de papel alta, aviso no painel).
    'fila_sobrecarga' => 5,

    'atualizar_a_cada_segundos' => 30,

    // Aparências tiradas das fotos de perfil. Quem está sem foto fica com um
    // boneco neutro (marcado como "sem foto" no painel) até alguém ajustar.
    'aparencias' => [
        23 => [ // Marcos Sergio
            'pele' => '#e3b08c', 'cabelo' => 'topete', 'corCabelo' => '#2a1c14',
            'barba' => 'cheia', 'oculos' => 'nenhum', 'brinco' => true,
            'roupa' => 'camiseta', 'corRoupa' => '#1f2937',
        ],
        41 => [ // Jeliel Sbalqueiro
            'pele' => '#c58c63', 'cabelo' => 'ondulado', 'corCabelo' => '#1c1410',
            'barba' => 'cheia', 'oculos' => 'escuro', 'brinco' => false,
            'roupa' => 'social', 'corRoupa' => '#111827',
        ],
        43 => [ // João Lima
            'pele' => '#6e432b', 'cabelo' => 'crespo', 'corCabelo' => '#0f0b09',
            'barba' => 'bigode', 'oculos' => 'redondo', 'brinco' => true,
            'roupa' => 'polo', 'corRoupa' => '#9ca3af',
        ],
        48 => [ // Eduardo Jansen
            'pele' => '#d8a37b', 'cabelo' => 'cacheado', 'corCabelo' => '#120d0b',
            'barba' => 'cavanhaque', 'oculos' => 'nenhum', 'brinco' => false,
            'roupa' => 'moletom', 'corRoupa' => '#1e293b',
        ],
        47 => [ // Renato Lima: mantém o terno de chefe; rosto e óculos escuros da foto
            'pele' => '#c08a62', 'cabelo' => 'curto', 'corCabelo' => '#3a3430',
            'barba' => 'curta', 'oculos' => 'escuro', 'brinco' => false,
            'roupa' => 'terno', 'corRoupa' => '#1e293b',
        ],
        49 => [ // Kevin Alencar
            'pele' => '#c99572', 'cabelo' => 'cacheado', 'corCabelo' => '#0f0b09',
            'barba' => 'bigode', 'oculos' => 'nenhum', 'brinco' => false,
            'roupa' => 'social', 'corRoupa' => '#111111',
        ],
        45 => [ // Matheus Cabral
            'pele' => '#e8b896', 'cabelo' => 'curto', 'corCabelo' => '#3a2618',
            'barba' => 'cheia', 'oculos' => 'nenhum', 'brinco' => false,
            'roupa' => 'camiseta', 'corRoupa' => '#c98a3a',
        ],
    ],

];
