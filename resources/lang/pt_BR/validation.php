<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Linhas de Linguagem de Validação
    |--------------------------------------------------------------------------
    |
    | As seguintes linhas de linguagem contêm as mensagens de erro padrão usadas
    | pela classe validator. Algumas dessas regras têm várias versões, como
    | as regras de tamanho. Sinta-se à vontade para ajustar cada mensagem aqui.
    |
    */

    'accepted'        => 'O campo :attribute deve ser aceito.',
    'accepted_if'     => 'O campo :attribute deve ser aceito quando :other for :value.',
    'active_url'      => 'O campo :attribute não é uma URL válida.',
    'after'           => 'O campo :attribute deve ser uma data posterior a :date.',
    'after_or_equal'  => 'O campo :attribute deve ser uma data posterior ou igual a :date.',
    'alpha'           => 'O campo :attribute deve conter apenas letras.',
    'alpha_dash'      => 'O campo :attribute deve conter apenas letras, números, traços e sublinhados.',
    'alpha_num'       => 'O campo :attribute deve conter apenas letras e números.',
    'array'           => 'O campo :attribute deve ser um array.',
    'before'          => 'O campo :attribute deve ser uma data anterior a :date.',
    'before_or_equal' => 'O campo :attribute deve ser uma data anterior ou igual a :date.',
    'between'         => [
        'numeric' => 'O campo :attribute deve estar entre :min e :max.',
        'file'    => 'O campo :attribute deve ter entre :min e :max kilobytes.',
        'string'  => 'O campo :attribute deve ter entre :min e :max caracteres.',
        'array'   => 'O campo :attribute deve ter entre :min e :max itens.',
    ],
    'boolean'          => 'O campo :attribute deve ser verdadeiro ou falso.',
    'confirmed'        => 'A confirmação de :attribute não confere.',
    'current_password' => 'A senha está incorreta.',
    'date'             => 'O campo :attribute não é uma data válida.',
    'date_equals'      => 'O campo :attribute deve ser uma data igual a :date.',
    'date_format'      => 'O campo :attribute não corresponde ao formato :format.',
    'declined'         => 'O campo :attribute deve ser recusado.',
    'declined_if'      => 'O campo :attribute deve ser recusado quando :other for :value.',
    'different'        => 'Os campos :attribute e :other devem ser diferentes.',
    'digits'           => 'O campo :attribute deve ter :digits dígitos.',
    'digits_between'   => 'O campo :attribute deve ter entre :min e :max dígitos.',
    'dimensions'       => 'O campo :attribute tem dimensões de imagem inválidas.',
    'distinct'         => 'O campo :attribute campo tem um valor duplicado.',
    'email'            => 'O campo :attribute deve ser um endereço de e-mail válido.',
    'ends_with'        => 'O campo :attribute deve terminar com um dos seguintes: :values.',
    'enum'             => 'O :attribute selecionado é inválido.',
    'exists'           => 'O :attribute selecionado é inválido.',
    'file'             => 'O campo :attribute deve ser um arquivo.',
    'filled'           => 'O campo :attribute deve ter um valor.',
    'gt' => [
        'numeric' => 'O campo :attribute deve ser maior que :value.',
        'file'    => 'O campo :attribute deve ser maior que :value kilobytes.',
        'string'  => 'O campo :attribute deve ser maior que :value caracteres.',
        'array'   => 'O campo :attribute deve ter mais que :value itens.',
    ],
    'gte' => [
        'numeric' => 'O campo :attribute deve ser maior ou igual a :value.',
        'file'    => 'O campo :attribute deve ser maior ou igual a :value kilobytes.',
        'string'  => 'O campo :attribute deve ser maior ou igual a :value caracteres.',
        'array'   => 'O campo :attribute deve ter :value itens ou mais.',
    ],
    'image'    => 'O campo :attribute deve ser uma imagem.',
    'in'       => 'O :attribute selecionado é inválido.',
    'in_array' => 'O campo :attribute não existe em :other.',
    'integer'  => 'O campo :attribute deve ser um número inteiro.',
    'ip'       => 'O campo :attribute deve ser um endereço IP válido.',
    'ipv4'     => 'O campo :attribute deve ser um endereço IPv4 válido.',
    'ipv6'     => 'O campo :attribute deve ser um endereço IPv6 válido.',
    'json'     => 'O campo :attribute deve ser uma string JSON válida.',
    'lt' => [
        'numeric' => 'O campo :attribute deve ser menor que :value.',
        'file'    => 'O campo :attribute deve ser menor que :value kilobytes.',
        'string'  => 'O campo :attribute deve ser menor que :value caracteres.',
        'array'   => 'O campo :attribute deve ter menos que :value itens.',
    ],
    'lte' => [
        'numeric' => 'O campo :attribute deve ser menor ou igual a :value.',
        'file'    => 'O campo :attribute deve ser menor ou igual a :value kilobytes.',
        'string'  => 'O campo :attribute deve ser menor ou igual a :value caracteres.',
        'array'   => 'O campo :attribute não deve ter mais que :value itens.',
    ],
    'mac_address' => 'O campo :attribute deve ser um endereço MAC válido.',
    'max' => [
        'numeric' => 'O campo :attribute não pode ser maior que :max.',
        'file'    => 'O campo :attribute não pode ser maior que :max kilobytes.',
        'string'  => 'O campo :attribute não pode ser maior que :max caracteres.',
        'array'   => 'O campo :attribute não pode ter mais que :max itens.',
    ],
    'mimes'     => 'O campo :attribute deve ser um arquivo do tipo: :values.',
    'mimetypes' => 'O campo :attribute deve ser um arquivo do tipo: :values.',
    'min' => [
        'numeric' => 'O campo :attribute deve ser pelo menos :min.',
        'file'    => 'O campo :attribute deve ter pelo menos :min kilobytes.',
        'string'  => 'O campo :attribute deve ter pelo menos :min caracteres.',
        'array'   => 'O campo :attribute deve ter pelo menos :min itens.',
    ],
    'multiple_of'          => 'O campo :attribute deve ser um múltiplo de :value.',
    'not_in'               => 'O :attribute selecionado é inválido.',
    'not_regex'            => 'O formato do campo :attribute é inválido.',
    'numeric'              => 'O campo :attribute deve ser um número.',
    'password'             => 'A senha está incorreta.',
    'present'              => 'O campo :attribute deve estar presente.',
    'prohibited'           => 'O campo :attribute é proibido.',
    'prohibited_if'        => 'O campo :attribute é proibido quando :other é :value.',
    'prohibited_unless'    => 'O campo :attribute é proibido a menos que :other esteja em :values.',
    'prohibits'            => 'O campo :attribute proíbe :other de estar presente.',
    'regex'                => 'O formato do campo :attribute é inválido.',
    'required'             => 'O campo :attribute é obrigatório.',
    'required_array_keys'  => 'O campo :attribute deve conter entradas para: :values.',
    'required_if'          => 'O campo :attribute é obrigatório quando :other é :value.',
    'required_unless'      => 'O campo :attribute é obrigatório a menos que :other esteja em :values.',
    'required_with'        => 'O campo :attribute é obrigatório quando :values está presente.',
    'required_with_all'    => 'O campo :attribute é obrigatório quando :values estão presentes.',
    'required_without'     => 'O campo :attribute é obrigatório quando :values não está presente.',
    'required_without_all' => 'O campo :attribute é obrigatório quando nenhum dos :values estão presentes.',
    'same'                 => 'Os campos :attribute e :other devem coincidir.',
    'size' => [
        'numeric' => 'O campo :attribute deve ser :size.',
        'file'    => 'O campo :attribute deve ter :size kilobytes.',
        'string'  => 'O campo :attribute deve ter :size caracteres.',
        'array'   => 'O campo :attribute deve conter :size itens.',
    ],
    'starts_with' => 'O campo :attribute deve começar com um dos seguintes: :values.',
    'string'      => 'O campo :attribute deve ser uma string.',
    'timezone'    => 'O campo :attribute deve ser uma zona válida.',
    'unique'      => 'O :attribute já está sendo utilizado.',
    'uploaded'    => 'O campo :attribute falhou no upload.',
    'url'         => 'O campo :attribute deve ser uma URL válida.',
    'uuid'        => 'O campo :attribute deve ser um UUID válido.',

    /*
    |--------------------------------------------------------------------------
    | Linhas de Linguagem de Validação Personalizadas
    |--------------------------------------------------------------------------
    |
    | Aqui você pode especificar mensagens de validação personalizadas para
    | atributos usando a convenção "attribute.rule" para nomear as linhas.
    | Isso torna rápido especificar uma linha de linguagem personalizada
    | específica para uma determinada regra de atributo.
    |
    */

    'custom' => [
        'nome-do-atributo' => [
            'nome-da-regra' => 'mensagem-customizada',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Atributos de Validação Personalizados
    |--------------------------------------------------------------------------
    |
    | As seguintes linhas de linguagem são usadas para trocar nosso placeholder
    | de atributo por algo mais amigável ao leitor, como "Endereço de E-mail"
    | em vez de "email". Isso simplesmente nos ajuda a tornar nossa mensagem
    | mais expressiva.
    |
    */

    'attributes' => [
        'name'     => 'nome',
        'email'    => 'e-mail',
        'password' => 'senha',
        'phone'    => 'telefone',
        'ds_tipo_chamado' => 'Descrição do Tipo',
        'id_tipo_chamado' => 'Tipo Vinculado',
        'ds_descricao' => 'Descrição do Motivo',
        'id_motivo_principal' => 'Motivo Pai',
        'ds_descricao_motivo' => 'Descrição do Detalhe',
        'id_empresa' => 'Empresa',
        'st_ativo' => 'Status',
    ],

];