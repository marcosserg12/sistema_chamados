<?php

namespace App\Http\Controllers;

use App\Models\Chamado;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    // API para o Topbar
    public function index()
    {
        $notifications = auth()->user()->notifications()->limit(20)->get();
        $unreadCount = auth()->user()->unreadNotifications()->count();

        return response()->json([
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
            'prazos' => $this->resumoPrazos(auth()->user()),
        ]);
    }

    /**
     * Quantos chamados "da pessoa" estão atrasados ou vencem hoje — a faixa
     * fixa no topo do sino e da página de notificações. Técnico: os dele;
     * admin: todos; usuário e gestor: os que já enxergam.
     */
    private function resumoPrazos($user): array
    {
        $base = Chamado::query()->doPainelDePrazos($user);

        $filtroTecnico = (int) $user->id_perfil === 4 ? ['tecnico' => $user->id_usuario] : [];

        return [
            'atrasados' => (clone $base)->comPrazoAtrasado()->count(),
            'vence_hoje' => (clone $base)->comPrazoVencendoHoje()->count(),
            'url_atrasados' => '/chamados?' . http_build_query(['prazo' => 'atrasado'] + $filtroTecnico),
            'url_vence_hoje' => '/chamados?' . http_build_query(['prazo' => 'vence_hoje'] + $filtroTecnico),
        ];
    }

    // Tela de listagem completa
    public function list()
    {
        $notifications = auth()->user()->notifications()->paginate(20);
        
        return Inertia::render('Notificacoes', [
            'notifications' => $notifications,
            'prazos' => $this->resumoPrazos(auth()->user()),
        ]);
    }

    public function markAsRead($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        auth()->user()->unreadNotifications->markAsRead();
        return back()->with('message', 'Todas as notificações foram marcadas como lidas.');
    }

    public function destroy($id)
    {
        $notification = auth()->user()->notifications()->findOrFail($id);
        $notification->delete();

        if (request()->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('message', 'Notificação removida.');
    }
}
