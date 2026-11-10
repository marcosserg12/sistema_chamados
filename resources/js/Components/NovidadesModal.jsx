import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Sparkles, X, Volume2, VolumeX, ListChecks, CalendarClock, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLeitor } from "@/hooks/use-voz";

// Sobe esse número toda vez que houver novidades novas pra anunciar — isso
// faz o aviso aparecer de novo pra todo mundo, mesmo quem já viu a versão
// anterior.
const VERSAO_NOVIDADES = 2;
const CHAVE_LOCALSTORAGE = `novidades_vistas_v${VERSAO_NOVIDADES}`;

// Perfis da equipe técnica (assumem chamados e definem prazo).
const PERFIS_EQUIPE = [1, 4, 5];

export default function NovidadesModal() {
  const { auth } = usePage().props;
  const [aberto, setAberto] = useState(false);
  const leitor = useLeitor();

  useEffect(() => {
    if (!auth?.user) return;
    const jaViu = localStorage.getItem(CHAVE_LOCALSTORAGE);
    if (!jaViu) {
      setAberto(true);
    }
  }, [auth?.user?.id_usuario]);

  const ehEquipe = PERFIS_EQUIPE.includes(auth?.user?.id_perfil);

  const itens = ehEquipe
    ? [
        {
          icone: CalendarClock,
          titulo: "Prazo de entrega obrigatório",
          descricao: "Ao assumir um chamado (ou atribuí-lo a alguém), informe até quando ele será entregue. Para mudar o prazo depois, só com justificativa: ela fica no histórico e o solicitante é avisado.",
        },
        {
          icone: BellRing,
          titulo: "Lembretes de prazo",
          descricao: "De segunda a sexta, às 8h, você recebe um resumo dos seus chamados Em Andamento que vencem no dia ou estão atrasados — todo dia, até finalizar ou mudar o prazo.",
        },
        {
          icone: ListChecks,
          titulo: "Prazo em todas as telas",
          descricao: "O prazo aparece na lista de chamados (com filtro de atrasados), no quadro, nos painéis e nas mensagens. No sino, uma faixa mostra os chamados atrasados.",
        },
      ]
    : [
        {
          icone: CalendarClock,
          titulo: "Prazo de entrega nos seus chamados",
          descricao: "Quando um técnico assumir o seu chamado, ele informa até quando vai entregar. Você recebe esse prazo e é avisado, com a justificativa, se ele mudar.",
        },
        {
          icone: BellRing,
          titulo: "Lembretes de prazo",
          descricao: "Você é avisado no dia em que o prazo vence. Se o chamado estiver aguardando o seu teste (ou pausado) e o prazo passar, chega um lembrete por dia útil.",
        },
      ];

  const fechar = () => {
    localStorage.setItem(CHAVE_LOCALSTORAGE, "true");
    leitor.parar();
    setAberto(false);
  };

  const textoParaLer = `Novidades no sistema de chamados. ${itens.map((i) => `${i.titulo}: ${i.descricao}`).join(" ")}`;

  if (!auth?.user) return null;

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden relative border border-indigo-100 dark:border-indigo-900"
          >
            <button
              onClick={fechar}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8 md:p-10">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Novidades no sistema</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Chegaram algumas melhorias no sistema de chamados:
              </p>

              <div className="space-y-4 mb-8">
                {itens.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      {React.createElement(item.icone ?? ListChecks, { className: "w-4 h-4 text-indigo-600 dark:text-indigo-400" })}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.titulo}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => leitor.ler(textoParaLer)}
                  title={leitor.suportado ? "Ouvir as novidades" : "Leitura em voz alta não suportada neste navegador"}
                  className="shrink-0 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400"
                >
                  {leitor.falando ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={fechar}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl"
                >
                  Entendi, continuar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
