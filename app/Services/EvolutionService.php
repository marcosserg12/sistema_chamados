<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionService
{
    protected $baseUrl;
    protected $apiKey;
    protected $instance;

    public function __construct()
    {
        $this->baseUrl = config('services.evolution.base_url');
        $this->apiKey = config('services.evolution.api_key');
        $this->instance = config('services.evolution.instance');
    }

    /**
     * Envia mensagem de texto via Evolution API
     *
     * @param string $number Número no formato 55DDD9XXXXXXXX
     * @param string $text Texto da mensagem
     */
    public function sendMessage(string $number, string $text)
    {
        if (empty($number)) return false;

        // Garante que o número tenha o prefixo 55
        if (strlen($number) <= 11) {
            $number = '55' . $number;
        }

        try {
            $response = Http::withHeaders([
                'apikey' => $this->apiKey,
                'Content-Type' => 'application/json'
            ])->post("{$this->baseUrl}/message/sendText/{$this->instance}", [
                'number' => $number,
                'text' => $text,
                'delay' => 1200, // Delay sutil para evitar bloqueios
                'linkPreview' => true
            ]);

            if ($response->failed()) {
                Log::error("Falha ao enviar WhatsApp para {$number}: " . $response->body());
                return false;
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error("Erro na Evolution API: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envia notificação apenas se o usuário tiver a preferência ativa
     */
    public function notifyUser($user, $message)
    {
        if (!$user) return;

        $prefs = $user->preferencias ?? [];
        $canalAtivo = $prefs['canal_whatsapp'] ?? false; // WhatsApp costuma ser false por padrão conforme seu código

        if ($canalAtivo && !empty($user->nu_telefone)) {
            $this->sendMessage($user->nu_telefone, $message);
        }
    }
}
