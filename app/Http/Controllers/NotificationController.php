<?php

namespace App\Http\Controllers;

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
            'unreadCount' => $unreadCount
        ]);
    }

    // Tela de listagem completa
    public function list()
    {
        $notifications = auth()->user()->notifications()->paginate(20);
        
        return Inertia::render('Notificacoes', [
            'notifications' => $notifications
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
