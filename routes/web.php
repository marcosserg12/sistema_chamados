<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ChamadoController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\LocalizacaoController;
use App\Http\Controllers\PatrimonioController;
use App\Http\Controllers\DashboardAdminController;
use App\Http\Controllers\ConfiguracaoChamadoController;
use App\Http\Controllers\ConfiguracaoController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard/admin', [DashboardAdminController::class, 'index'])
        ->name('dashboard.admin');

    Route::get('/dashboard/tecnico', [App\Http\Controllers\DashboardTecnicoController::class, 'index'])
        ->name('dashboard.tecnico');

    Route::get('/api/localizacoes', [ChamadoController::class, 'getLocalizacoes']);
    Route::get('/api/motivos', [ChamadoController::class, 'getMotivos']);
    Route::get('/api/detalhes-motivo', [ChamadoController::class, 'getDetalhesMotivo']);
    
    Route::get('/api/search', [App\Http\Controllers\SearchController::class, 'globalSearch']);
    Route::get('/api/notifications', [App\Http\Controllers\NotificationController::class, 'index']);
    Route::post('/api/notifications/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::delete('/api/notifications/{id}', [App\Http\Controllers\NotificationController::class, 'destroy']);
    Route::post('/api/notifications/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead']);

    Route::get('/api/tech-chat', [App\Http\Controllers\ChatTecnicoController::class, 'index']);
    Route::post('/api/tech-chat', [App\Http\Controllers\ChatTecnicoController::class, 'store']);
    Route::get('/api/tech-chat/users', [App\Http\Controllers\ChatTecnicoController::class, 'getUsers']);

    Route::get('/notificacoes', [App\Http\Controllers\NotificationController::class, 'list'])->name('notifications.list');
    Route::post('/notificacoes/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');
    Route::delete('/notificacoes/{id}', [App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');

    Route::get('/chamados', [ChamadoController::class, 'index'])->name('chamados.index');
    Route::get('/chamados/novo', [ChamadoController::class, 'create'])->name('chamados.create');
    Route::post('/chamados', [ChamadoController::class, 'store'])->name('chamados.store');
    Route::get('/chamados/{id}', [ChamadoController::class, 'show'])->name('chamados.show');
    Route::put('/chamados/{id}', [ChamadoController::class, 'update'])->name('chamados.update');
    Route::post('/chamados/{id}/historico', [ChamadoController::class, 'storeComment'])->name('chamados.comment');
    Route::post('/chamados/{id}/chat', [ChamadoController::class, 'storeChatMessage'])->name('chamados.chat');
    Route::get('/api/chamados/{id}/chat', [ChamadoController::class, 'getChatMessages'])->name('api.chamados.chat');
    Route::post('/api/chamados/{id}/chat/read', [ChamadoController::class, 'markChatAsRead'])->name('api.chamados.chat.read');

    Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');
    Route::post('/empresas', [EmpresaController::class, 'store'])->name('empresas.store');
    Route::put('/empresas/{id}', [EmpresaController::class, 'update'])->name('empresas.update');
    Route::put('/empresas/{id}/toggle-status', [EmpresaController::class, 'toggleStatus'])->name('empresas.toggle-status');

    Route::get('/usuarios', [UsuarioController::class, 'index'])->name('usuarios.index');
    Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update'])->name('usuarios.update');

    Route::get('/localizacoes', [LocalizacaoController::class, 'index'])->name('localizacoes.index');
    Route::post('/localizacoes', [LocalizacaoController::class, 'store'])->name('localizacoes.store');
    Route::put('/localizacoes/{id}', [LocalizacaoController::class, 'update'])->name('localizacoes.update');
    Route::put('/localizacoes/{id}/toggle-status', [LocalizacaoController::class, 'toggleStatus'])->name('localizacoes.toggle-status');

    Route::get('/patrimonios', [PatrimonioController::class, 'index'])->name('patrimonios.index');
    Route::post('/patrimonios', [PatrimonioController::class, 'store'])->name('patrimonios.store');
    Route::put('/patrimonios/{id}', [PatrimonioController::class, 'update'])->name('patrimonios.update');

    Route::prefix('configuracao')->group(function () {
        Route::get('/motivos', [ConfiguracaoChamadoController::class, 'index'])->name('config.motivos');
        Route::post('/tipos', [ConfiguracaoChamadoController::class, 'storeTipo']);
        Route::put('/tipos/{id}', [ConfiguracaoChamadoController::class, 'updateTipo']);
        Route::delete('/tipos/{id}', [ConfiguracaoChamadoController::class, 'destroyTipo']);
        Route::post('/motivos', [ConfiguracaoChamadoController::class, 'storeMotivo']);
        Route::put('/motivos/{id}', [ConfiguracaoChamadoController::class, 'updateMotivo']);
        Route::delete('/motivos/{id}', [ConfiguracaoChamadoController::class, 'destroyMotivo']);
        Route::post('/associados', [ConfiguracaoChamadoController::class, 'storeAssociado']);
        Route::put('/associados/{id}', [ConfiguracaoChamadoController::class, 'updateAssociado']);
        Route::delete('/associados/{id}', [ConfiguracaoChamadoController::class, 'destroyAssociado']);
    });
    Route::get('/configuracoes', [ConfiguracaoController::class, 'index'])->name('configuracoes.index');
    Route::patch('/configuracoes', [ConfiguracaoController::class, 'update'])->name('configuracoes.update');
    Route::patch('/configuracoes/perfil', [ConfiguracaoController::class, 'updateProfile'])->name('configuracoes.update-profile');
    Route::post('/configuracoes/foto', [ConfiguracaoController::class, 'updatePhoto'])->name('configuracoes.update-photo');
    Route::put('/configuracoes/password', [ConfiguracaoController::class, 'updatePassword'])->name('configuracoes.update-password');
});

require __DIR__ . '/auth.php';
