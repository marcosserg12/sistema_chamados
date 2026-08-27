import React, { useState } from "react";
import { toast } from "sonner";

/**
 * Ditado por voz (fala -> texto), via Web Speech API. Só funciona em
 * navegadores baseados em Chromium (Chrome/Edge); em outros, avisa que
 * não é suportado.
 */
export function useDitado(aoReconhecer) {
  const recognitionRef = React.useRef(null);
  const [gravando, setGravando] = useState(false);
  const SpeechRecognitionCtor = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const alternar = () => {
    if (!SpeechRecognitionCtor) {
      toast.error("Ditado por voz não é suportado neste navegador. Tente o Chrome ou o Edge.");
      return;
    }

    if (gravando) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let textoFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          textoFinal += event.results[i][0].transcript;
        }
      }
      if (textoFinal.trim()) aoReconhecer(textoFinal.trim());
    };
    recognition.onerror = () => setGravando(false);
    recognition.onend = () => setGravando(false);

    recognitionRef.current = recognition;
    recognition.start();
    setGravando(true);
  };

  return { suportado: !!SpeechRecognitionCtor, gravando, alternar };
}

/**
 * Grava um áudio (fala -> arquivo de áudio) via MediaRecorder, pra enviar
 * como mensagem de voz num chat. Chama aoGravar(arquivo) quando a gravação
 * termina. Pede permissão de microfone na primeira vez que é usado.
 */
export function useGravadorAudio(aoGravar) {
  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const streamRef = React.useRef(null);
  const [gravando, setGravando] = useState(false);

  const suportado = typeof window !== "undefined"
    && !!navigator.mediaDevices?.getUserMedia
    && typeof window.MediaRecorder !== "undefined";

  const pararStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const iniciar = async () => {
    if (!suportado) {
      toast.error("Gravação de áudio não é suportada neste navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        pararStream();
        if (blob.size > 0) {
          const extensao = (recorder.mimeType || "audio/webm").includes("ogg") ? "ogg" : "weba";
          const arquivo = new File([blob], `audio_${Date.now()}.${extensao}`, { type: blob.type });
          aoGravar(arquivo);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setGravando(true);
    } catch (err) {
      toast.error("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  };

  const parar = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setGravando(false);
  };

  const cancelar = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    pararStream();
    setGravando(false);
  };

  const alternar = () => {
    if (gravando) {
      parar();
    } else {
      iniciar();
    }
  };

  return { suportado, gravando, alternar, cancelar };
}

/**
 * Lê um texto em voz alta (texto -> fala), via Web Speech API
 * (speechSynthesis). Disponível na maioria dos navegadores modernos.
 */
export function useLeitor() {
  const [falando, setFalando] = useState(false);
  const suportado = typeof window !== "undefined" && "speechSynthesis" in window;

  const ler = (texto) => {
    if (!suportado) {
      toast.error("Leitura em voz alta não é suportada neste navegador.");
      return;
    }
    if (falando) {
      window.speechSynthesis.cancel();
      setFalando(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "pt-BR";
    utterance.onend = () => setFalando(false);
    utterance.onerror = () => setFalando(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setFalando(true);
  };

  const parar = () => {
    window.speechSynthesis?.cancel();
    setFalando(false);
  };

  return { suportado, falando, ler, parar };
}
