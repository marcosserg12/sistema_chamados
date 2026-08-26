<?php

namespace App\Services;

use Anthropic\Client;
use App\Models\MotivoAssociado;
use App\Models\MotivoPrincipal;
use App\Models\TipoChamado;
use Illuminate\Support\Facades\Log;

class AiChamadoService
{
    /**
     * A partir da descrição livre de um problema, sugere tipo/motivo/detalhe
     * (e um título curto) usando a árvore de classificação já cadastrada no
     * sistema. Nunca inventa um id fora da árvore — a resposta é validada
     * contra a taxonomia real antes de ser devolvida.
     *
     * @return array{ok: bool, titulo?: string, id_tipo_chamado?: int, id_motivo_principal?: int, id_motivo_associado?: int, st_grau?: int|null, erro?: string}
     */
    public function sugerirClassificacao(string $descricao, ?int $idEmpresa = null): array
    {
        $apiKey = config('services.anthropic.api_key');
        if (!$apiKey) {
            return ['ok' => false, 'erro' => 'Integração com IA não configurada (falta ANTHROPIC_API_KEY no servidor).'];
        }

        $taxonomia = $this->montarTaxonomia($idEmpresa);
        if (empty($taxonomia)) {
            return ['ok' => false, 'erro' => 'Não há tipos de chamado cadastrados para classificar.'];
        }

        [$idsTipo, $idsMotivo, $idsDetalhe] = $this->coletarIdsValidos($taxonomia);

        try {
            $client = new Client(apiKey: $apiKey);

            $message = $client->messages->create(
                model: 'claude-opus-5',
                maxTokens: 1024,
                system: $this->montarPromptSistema($taxonomia),
                messages: [
                    ['role' => 'user', 'content' => $descricao],
                ],
                outputConfig: [
                    'format' => [
                        'type' => 'json_schema',
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'titulo' => [
                                    'type' => 'string',
                                    'maxLength' => 100,
                                    'description' => 'Título curto e objetivo do chamado, em português, resumindo o problema.',
                                ],
                                'id_tipo_chamado' => ['type' => 'integer', 'enum' => $idsTipo],
                                'id_motivo_principal' => ['type' => 'integer', 'enum' => $idsMotivo],
                                'id_motivo_associado' => ['type' => 'integer', 'enum' => $idsDetalhe],
                                'st_grau' => [
                                    'type' => 'integer',
                                    'enum' => [0, 1, 2, 3, 4],
                                    'description' => 'Use 0 quando id_motivo_principal não for o motivo "Cadastro de Paciente" (id 6). Quando for 6: 1=Melhoria, 2=Problema, 3=Cadastro de Paciente, 4=Relatório.',
                                ],
                            ],
                            'required' => ['titulo', 'id_tipo_chamado', 'id_motivo_principal', 'id_motivo_associado', 'st_grau'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('Falha ao consultar IA para sugestão de chamado: ' . $e->getMessage());
            return ['ok' => false, 'erro' => 'Não foi possível consultar a IA agora. Tente novamente ou preencha manualmente.'];
        }

        $dados = null;
        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $dados = json_decode($block->text, true);
                break;
            }
        }

        if (!is_array($dados)) {
            return ['ok' => false, 'erro' => 'A IA não retornou uma resposta válida. Tente novamente.'];
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
            'Você classifica chamados de suporte de TI para um sistema hospitalar/nutricional.',
            'Dado o relato de um usuário, escolha a combinação mais adequada de tipo, motivo e detalhe dentro da árvore abaixo. Nunca invente um id que não esteja listado.',
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
        $linhas[] = 'Regras:';
        $linhas[] = '- id_motivo_principal deve pertencer ao id_tipo_chamado escolhido, e id_motivo_associado deve pertencer ao id_motivo_principal escolhido (siga a árvore acima).';
        $linhas[] = '- st_grau só é diferente de 0 quando id_motivo_principal for 6 (Cadastro de Paciente): 1=Melhoria, 2=Problema, 3=Cadastro de Paciente, 4=Relatório, conforme o que a pessoa está pedindo. Nos demais casos, st_grau=0.';
        $linhas[] = '- titulo deve ser curto (até 100 caracteres), em português, resumindo o problema — não copie a descrição inteira.';
        $linhas[] = '- Se a descrição não tiver detalhe suficiente pra decidir com confiança, escolha a opção mais genérica/provável dentro da árvore — a pessoa revisa tudo antes de enviar o chamado.';

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

                    return [
                        'ok' => true,
                        'titulo' => mb_substr(trim((string) ($dados['titulo'] ?? '')), 0, 120),
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
