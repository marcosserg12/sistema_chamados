<?php

namespace App\Services;

use App\Models\MotivoAssociado;
use App\Models\MotivoPrincipal;
use App\Models\TipoChamado;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiChamadoService
{
    // openai/gpt-oss-20b roda na Groq, gratuito e sem cartão de crédito, com
    // saída estruturada (JSON Schema) garantida via "strict mode" — e cota de
    // 1.000 requisições/dia, bem mais folgada que os provedores testados antes.
    private const MODELO = 'openai/gpt-oss-20b';
    private const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

    /**
     * Conversa com o usuário sobre o problema até ter informação suficiente
     * pra classificar o chamado. A cada turno a IA decide: ou pede mais
     * detalhe (tipo_resposta=pergunta), ou já devolve a classificação final
     * (tipo_resposta=classificacao) — nunca inventa um id fora da árvore, a
     * classificação final é sempre revalidada contra a taxonomia real.
     *
     * @param array<int, array{papel: string, texto: string}> $historico Turnos da conversa, na ordem (papel: 'user' ou 'model').
     * @return array{ok: bool, tipo_resposta?: string, pergunta?: string, titulo?: string, descricao?: string, id_tipo_chamado?: int, id_motivo_principal?: int, id_motivo_associado?: int, st_grau?: int|null, erro?: string}
     */
    public function conversar(array $historico, ?int $idEmpresa = null): array
    {
        $apiKey = config('services.groq.api_key');
        if (!$apiKey) {
            return ['ok' => false, 'erro' => 'Integração com IA não configurada (falta GROQ_API_KEY no servidor).'];
        }

        $taxonomia = $this->montarTaxonomia($idEmpresa);
        if (empty($taxonomia)) {
            return ['ok' => false, 'erro' => 'Não há tipos de chamado cadastrados para classificar.'];
        }

        [$idsTipo, $idsMotivo, $idsDetalhe] = $this->coletarIdsValidos($taxonomia);

        // "strict mode" da Groq exige que TODO campo do schema esteja em
        // "required" (não existe campo opcional em strict) — por isso o
        // schema tem tanto os campos da pergunta quanto os da classificação
        // sempre presentes; o prompt instrui a IA a preencher os campos do
        // outro modo com um valor de preenchimento (ignorado no PHP).
        $schema = [
            'type' => 'object',
            'properties' => [
                'tipo_resposta' => [
                    'type' => 'string',
                    'enum' => ['pergunta', 'classificacao'],
                    'description' => 'Use "pergunta" quando ainda faltar informação essencial pra classificar com confiança. Use "classificacao" quando já souber o suficiente pra preencher o chamado.',
                ],
                'pergunta' => [
                    'type' => 'string',
                    'description' => 'Quando tipo_resposta="pergunta": uma pergunta curta, natural e direta (uma coisa de cada vez) pra pessoa detalhar melhor o problema — nunca um formulário de várias perguntas juntas. Quando tipo_resposta="classificacao": deixe como string vazia "".',
                ],
                'titulo' => [
                    'type' => 'string',
                    'description' => 'Quando tipo_resposta="classificacao": título curto e objetivo do chamado (até 100 caracteres), em português, resumindo o problema de forma específica (não genérica). Quando tipo_resposta="pergunta": deixe como string vazia "".',
                ],
                'descricao' => [
                    'type' => 'string',
                    'description' => 'Quando tipo_resposta="classificacao": descrição breve e direta do chamado para o técnico, em português, juntando o que a pessoa foi contando na conversa — sem alongar, sem virar um relatório formal. Escreva como a própria pessoa escreveria contando o problema (ex: "Tentei cadastrar um paciente no sistema e apareceu uma mensagem de erro na tela"), nunca em terceira pessoa tipo "o usuário relata que" ou "o usuário informa que". Baseie-se só no que foi dito — não invente detalhes, números de série, horários ou informações que não foram mencionadas. Quando tipo_resposta="pergunta": deixe como string vazia "".',
                ],
                'id_tipo_chamado' => [
                    'type' => 'integer',
                    'enum' => $idsTipo,
                    'description' => "Quando tipo_resposta=\"pergunta\": use {$idsTipo[0]} como valor de preenchimento (será ignorado).",
                ],
                'id_motivo_principal' => [
                    'type' => 'integer',
                    'enum' => $idsMotivo,
                    'description' => "Quando tipo_resposta=\"pergunta\": use {$idsMotivo[0]} como valor de preenchimento (será ignorado).",
                ],
                'id_motivo_associado' => [
                    'type' => 'integer',
                    'enum' => $idsDetalhe,
                    'description' => "Quando tipo_resposta=\"pergunta\": use {$idsDetalhe[0]} como valor de preenchimento (será ignorado).",
                ],
                'st_grau' => [
                    'type' => 'integer',
                    'enum' => [0, 1, 2, 3, 4],
                    'description' => 'Use 0 quando id_motivo_principal não for o motivo "Cadastro de Paciente" (id 6). Quando id_motivo_principal FOR 6, st_grau NUNCA pode ser 0 — escolha sempre um valor entre 1 e 4: 1=Melhoria, 2=Problema, 3=Cadastro de Paciente (só quando a pessoa está pedindo pra alguém da equipe cadastrar um paciente novo, fornecendo os dados dele), 4=Relatório. Qualquer erro, falha ou dificuldade ao tentar cadastrar, alterar ou usar o sistema é 2 (Problema), mesmo que a palavra "cadastro" apareça no relato. Se estiver em dúvida entre essas opções mesmo depois de perguntar, use 2 (Problema) — é o caso mais comum. Quando tipo_resposta="pergunta": use 0.',
                ],
            ],
            'required' => ['tipo_resposta', 'pergunta', 'titulo', 'descricao', 'id_tipo_chamado', 'id_motivo_principal', 'id_motivo_associado', 'st_grau'],
            'additionalProperties' => false,
        ];

        $messages = [
            ['role' => 'system', 'content' => $this->montarPromptSistema($taxonomia)],
        ];
        foreach ($historico as $turno) {
            $papel = ($turno['papel'] ?? '') === 'model' ? 'assistant' : 'user';
            $texto = trim((string) ($turno['texto'] ?? ''));
            if ($texto === '') {
                continue;
            }
            $messages[] = ['role' => $papel, 'content' => $texto];
        }

        if (count($messages) < 2) {
            return ['ok' => false, 'erro' => 'Descreva o problema pra começar.'];
        }

        $corpo = [
            'model' => self::MODELO,
            'messages' => $messages,
            'response_format' => [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => 'classificacao_chamado',
                    'strict' => true,
                    'schema' => $schema,
                ],
            ],
        ];

        // A camada gratuita ocasionalmente responde 503/429 (sobrecarga
        // temporária) — tenta mais algumas vezes antes de desistir, em vez
        // de já mostrar erro.
        $maxTentativas = 3;
        $response = null;

        for ($tentativa = 1; $tentativa <= $maxTentativas; $tentativa++) {
            try {
                $response = Http::timeout(30)
                    ->withToken($apiKey)
                    ->post(self::ENDPOINT, $corpo);
            } catch (\Throwable $e) {
                if ($tentativa === $maxTentativas) {
                    Log::warning('Erro ao consultar Groq para sugestão de chamado: ' . $e->getMessage());
                    return ['ok' => false, 'erro' => 'Não foi possível consultar a IA agora. Tente novamente ou preencha manualmente.'];
                }
                continue;
            }

            if ($response->successful()) {
                break;
            }

            if (!in_array($response->status(), [429, 503], true) || $tentativa === $maxTentativas) {
                Log::warning('Falha ao consultar Groq para sugestão de chamado: ' . $response->body());
                return ['ok' => false, 'erro' => 'Não foi possível consultar a IA agora. Tente novamente ou preencha manualmente.'];
            }

            usleep(800000); // meio segundo antes de tentar de novo
        }

        $texto = $response->json('choices.0.message.content');

        $dados = is_string($texto) ? json_decode($texto, true) : null;

        if (!is_array($dados)) {
            return ['ok' => false, 'erro' => 'A IA não retornou uma resposta válida. Tente novamente.'];
        }

        if (($dados['tipo_resposta'] ?? '') === 'pergunta') {
            $pergunta = trim((string) ($dados['pergunta'] ?? ''));
            if ($pergunta === '') {
                return ['ok' => false, 'erro' => 'A IA não retornou uma resposta válida. Tente novamente.'];
            }

            return ['ok' => true, 'tipo_resposta' => 'pergunta', 'pergunta' => $pergunta];
        }

        return $this->validarConsistencia($dados, $taxonomia);
    }

    /**
     * Monta a árvore tipo -> motivo -> detalhe com apenas itens ativos.
     * Quando $idEmpresa é informado, os detalhes do motivo "Cadastro de
     * Paciente" (id 6) já vêm filtrados pra essa empresa — mesma regra do
     * ChamadoController::getDetalhesMotivo.
     */
    private function montarTaxonomia(?int $idEmpresa): array
    {
        $tipos = TipoChamado::where('st_ativo', 'A')->orderBy('ds_tipo_chamado')->get();

        $taxonomia = [];
        foreach ($tipos as $tipo) {
            $motivos = MotivoPrincipal::where('id_tipo_chamado', $tipo->id_tipo_chamado)
                ->where('st_ativo', 'A')
                ->orderBy('ds_descricao')
                ->get();

            $motivosArr = [];
            foreach ($motivos as $motivo) {
                $detalhesQuery = MotivoAssociado::where('id_motivo_principal', $motivo->id_motivo_principal)
                    ->where('st_ativo', 'A');

                if ((int) $motivo->id_motivo_principal === 6 && $idEmpresa) {
                    $detalhesQuery->where('id_empresa', $idEmpresa);
                }

                $detalhes = $detalhesQuery->orderBy('ds_descricao_motivo')->get();

                if ($detalhes->isEmpty()) {
                    // Sem detalhes cadastrados (ou nenhum pra essa empresa) — não dá
                    // pra fechar essa combinação, então não oferecemos esse motivo.
                    continue;
                }

                $motivosArr[] = [
                    'id' => (int) $motivo->id_motivo_principal,
                    'descricao' => $motivo->ds_descricao,
                    'detalhes' => $detalhes->map(fn ($d) => [
                        'id' => (int) $d->id_motivo_associado,
                        'descricao' => $d->ds_descricao_motivo,
                    ])->values()->all(),
                ];
            }

            if (empty($motivosArr)) {
                continue;
            }

            $taxonomia[] = [
                'id' => (int) $tipo->id_tipo_chamado,
                'descricao' => $tipo->ds_tipo_chamado,
                'motivos' => $motivosArr,
            ];
        }

        return $taxonomia;
    }

    private function coletarIdsValidos(array $taxonomia): array
    {
        $idsTipo = [];
        $idsMotivo = [];
        $idsDetalhe = [];

        foreach ($taxonomia as $tipo) {
            $idsTipo[] = $tipo['id'];
            foreach ($tipo['motivos'] as $motivo) {
                $idsMotivo[] = $motivo['id'];
                foreach ($motivo['detalhes'] as $detalhe) {
                    $idsDetalhe[] = $detalhe['id'];
                }
            }
        }

        return [
            array_values(array_unique($idsTipo)),
            array_values(array_unique($idsMotivo)),
            array_values(array_unique($idsDetalhe)),
        ];
    }

    private function montarPromptSistema(array $taxonomia): string
    {
        $linhas = [
            'Você é um assistente de abertura de chamados de suporte de TI para um sistema hospitalar/nutricional, conversando diretamente com quem está com o problema.',
            'Seu objetivo é juntar informação suficiente pra classificar o chamado corretamente, escolhendo a combinação mais adequada de tipo, motivo e detalhe dentro da árvore abaixo. Nunca invente um id que não esteja listado.',
            '',
            'Árvore de classificação (tipo > motivo > detalhe):',
        ];

        foreach ($taxonomia as $tipo) {
            $linhas[] = "- Tipo #{$tipo['id']}: {$tipo['descricao']}";
            foreach ($tipo['motivos'] as $motivo) {
                $linhas[] = "  - Motivo #{$motivo['id']}: {$motivo['descricao']}";
                foreach ($motivo['detalhes'] as $detalhe) {
                    $linhas[] = "    - Detalhe #{$detalhe['id']}: {$detalhe['descricao']}";
                }
            }
        }

        $linhas[] = '';
        $linhas[] = 'Como conversar:';
        $linhas[] = '- Se o relato já tiver detalhe suficiente pra classificar com confiança (o quê, onde/em qual sistema, e algo do que está acontecendo), responda direto com tipo_resposta="classificacao" — não fique perguntando por perguntar.';
        $linhas[] = '- Se o relato for vago demais pra classificar com confiança (ex: "meu computador deu problema", "o sistema não funciona", sem dizer o quê exatamente), responda com tipo_resposta="pergunta" e faça UMA pergunta curta, natural e direta pra entender melhor — como uma pessoa perguntaria, não um formulário. Não pergunte várias coisas de uma vez.';
        $linhas[] = '- Se o relato mencionar "sistema" sem dizer QUAL (não fica claro se é um sistema específico do Grupo Ibra como Sisibranutro/Gerencial/etc, ou um problema genérico de Windows/Office), NUNCA chute — pergunte qual sistema é (ex: "é o Sisibranutro, o Gerencial, ou é algo do Windows/Office mesmo?"). Escolher "Problemas com Windows/Microsoft" por padrão quando pode ser um sistema do Grupo Ibra é um erro comum a evitar.';
        $linhas[] = '- Se fizer sentido pro tipo de problema e a pessoa não tiver dito onde/em qual local (setor, unidade) isso está acontecendo, pode perguntar também — mas isso é opcional, não trave a classificação só por causa disso.';
        $linhas[] = '- Depois que a pessoa responder sua pergunta, avalie de novo: se já deu pra entender o suficiente, classifique; se ainda estiver vago, pode perguntar mais uma vez (no máximo 2-3 perguntas no total — depois disso, classifique com o que tiver, usando a opção mais genérica/provável).';
        $linhas[] = '- Nunca repita uma pergunta que a pessoa já respondeu, e nunca peça informação que ela já deu em uma mensagem anterior.';
        $linhas[] = '- O schema de resposta exige todos os campos preenchidos mesmo quando tipo_resposta="pergunta" — nesse caso, siga exatamente o valor de preenchimento indicado na descrição de cada campo (eles são ignorados).';
        $linhas[] = '';
        $linhas[] = 'Regras da classificação final (tipo_resposta="classificacao"):';
        $linhas[] = '- id_motivo_principal deve pertencer ao id_tipo_chamado escolhido, e id_motivo_associado deve pertencer ao id_motivo_principal escolhido (siga a árvore acima).';
        $linhas[] = '- st_grau só é diferente de 0 quando id_motivo_principal for 6 (Cadastro de Paciente): 1=Melhoria, 2=Problema, 3=Cadastro de Paciente, 4=Relatório, conforme o que a pessoa está pedindo. Nos demais casos, st_grau=0.';
        $linhas[] = '- Se id_motivo_principal=6 e não estiver claro se é Melhoria/Problema/Cadastro/Relatório, NUNCA deixe st_grau=0 — pergunte pra pessoa qual das opções é (ex: "isso é um problema em algo que já existia ou você quer que a gente cadastre algo novo?"), e só classifique depois de saber. Se mesmo assim não der pra saber, use 2 (Problema).';
        $linhas[] = '- Pedidos para corrigir/alterar um dado de um paciente já cadastrado (ex: trocar o número de atendimento, corrigir nome, corrigir data) nos sistemas Sisibranutro/Gerencial usam st_grau=2 (Problema), não st_grau=3 — st_grau=3 é só para o cadastro de um paciente novo.';
        $linhas[] = '- st_grau=3 (Cadastro de Paciente) só se aplica quando a pessoa está pedindo pra registrar um paciente novo e vai fornecer os dados dele (nome, data de nascimento, etc). Um erro, falha, trava ou dificuldade ao tentar cadastrar/usar o sistema é st_grau=2 (Problema), mesmo mencionando a palavra "cadastro" — ex: "não consigo cadastrar um paciente, dá erro na tela" é Problema, não Cadastro de Paciente.';
        $linhas[] = '- titulo deve ser curto (até 100 caracteres), em português, resumindo o problema — não copie a descrição inteira.';
        $linhas[] = '- descricao deve ser curta e direta, escrita como a própria pessoa escreveria (primeira pessoa, tom natural de quem está relatando um problema), juntando o que foi dito na conversa inteira, nunca em tom de relatório/terceira pessoa ("o usuário relata que..."). Só corrija a ortografia e organize em frases completas — mantendo só as informações que foram realmente ditas, sem inventar nada novo e sem alongar.';

        return implode("\n", $linhas);
    }

    /**
     * Confirma que a combinação devolvida pela IA realmente existe na árvore
     * (tipo -> motivo -> detalhe). Enums no schema já reduzem bastante a
     * chance de inconsistência, mas essa checagem garante que a combinação
     * faz sentido junto (ex: motivo pertence mesmo ao tipo escolhido).
     */
    private function validarConsistencia(array $dados, array $taxonomia): array
    {
        foreach ($taxonomia as $tipo) {
            if ((int) ($dados['id_tipo_chamado'] ?? 0) !== $tipo['id']) {
                continue;
            }

            foreach ($tipo['motivos'] as $motivo) {
                if ((int) ($dados['id_motivo_principal'] ?? 0) !== $motivo['id']) {
                    continue;
                }

                foreach ($motivo['detalhes'] as $detalhe) {
                    if ((int) ($dados['id_motivo_associado'] ?? 0) !== $detalhe['id']) {
                        continue;
                    }

                    $stGrau = $motivo['id'] === 6 ? (int) ($dados['st_grau'] ?? 0) : 0;
                    if ($motivo['id'] === 6 && $stGrau <= 0) {
                        // A IA não devia deixar st_grau=0 pra esse motivo (o prompt
                        // pede pra sempre escolher 1-4), mas se escapar, cai pra
                        // Problema (o caso mais comum) em vez de deixar sem marcar.
                        $stGrau = 2;
                    }

                    return [
                        'ok' => true,
                        'tipo_resposta' => 'classificacao',
                        'titulo' => mb_substr(trim((string) ($dados['titulo'] ?? '')), 0, 120),
                        'descricao' => trim((string) ($dados['descricao'] ?? '')),
                        'id_tipo_chamado' => $tipo['id'],
                        'id_motivo_principal' => $motivo['id'],
                        'id_motivo_associado' => $detalhe['id'],
                        'st_grau' => $stGrau > 0 ? $stGrau : null,
                    ];
                }
            }
        }

        return ['ok' => false, 'erro' => 'A IA sugeriu uma combinação que não bate com o cadastro atual. Tente reformular a descrição ou preencha manualmente.'];
    }
}
