<?php

namespace App\Http\Controllers;

use App\Services\EscritorioService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EscritorioController extends Controller
{
    // Tela da equipe técnica: só os técnicos e o coordenador (config escritorio.chefe).
    const PERFIL_TECNICO = 4;

    public function __construct(private EscritorioService $escritorio)
    {
    }

    public static function podeVer($user): bool
    {
        return $user && ($user->id_perfil == self::PERFIL_TECNICO || self::ehChefe($user));
    }

    // Só o coordenador ajusta a aparência dos bonecos.
    public static function ehChefe($user): bool
    {
        return $user && (int) $user->id_usuario === (int) config('escritorio.chefe');
    }

    public function index()
    {
        if (!self::podeVer(auth()->user())) {
            return redirect()->route('chamados.index');
        }

        return Inertia::render('Escritorio', [
            'inicial' => $this->escritorio->montar(),
            'podeEditarAparencia' => self::ehChefe(auth()->user()),
        ]);
    }

    public function dados()
    {
        abort_unless(self::podeVer(auth()->user()), 403);

        return response()->json($this->escritorio->montar());
    }

    public function salvarAparencia(Request $request, int $id)
    {
        abort_unless(self::ehChefe(auth()->user()), 403);

        $cor = ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'];
        $dados = $request->validate([
            'pele' => $cor,
            'corCabelo' => $cor,
            'corRoupa' => $cor,
            'cabelo' => 'nullable|in:curto,topete,ondulado,cacheado,crespo,longo,coque,raspado,careca',
            'barba' => 'nullable|in:nenhuma,bigode,cavanhaque,curta,cheia',
            'oculos' => 'nullable|in:nenhum,redondo,quadrado,escuro',
            'roupa' => 'nullable|in:camiseta,moletom,polo,social,terno',
            'corpo' => 'nullable|in:reto,curvo',
            'brinco' => 'nullable|boolean',
        ]);

        return response()->json([
            'aparencia' => $this->escritorio->salvarAparencia($id, array_filter($dados, fn ($v) => $v !== null)),
        ]);
    }
}
