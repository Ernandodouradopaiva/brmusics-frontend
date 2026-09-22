'use client';

import { useMemo, useState } from 'react';
import { FileBarChart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notifyError, notifySuccess } from '@/lib/notify';
import { resolveApiErrorMessage } from '@/lib/apiError';
import {
  podeAcessarPaginaRelatorios,
  podeGerarRelatorio,
  podeVerRelatorio,
} from '@/lib/permissions';
import { relatoriosService } from '@/services/relatorios';
import { FeedbackMessage } from '@/components/FeedbackMessage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import dashStyles from '@/app/dashboard/dashboard.module.css';
import styles from './relatorios.module.css';

type RelatorioCard = {
  id: string;
  recurso: string;
  titulo: string;
  descricao: string;
  precisaPeriodo?: boolean;
  gerar: (periodo: { ano: number; mes: number }) => Promise<void>;
};

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const RELATORIOS: RelatorioCard[] = [
  {
    id: 'usuarios',
    recurso: 'relatorio-usuarios',
    titulo: 'Usuários',
    descricao: 'Totais e listagem cadastral (CPF, nome, cargo e status).',
    gerar: async () => relatoriosService.abrirPdfUsuarios(),
  },
  {
    id: 'musicas',
    recurso: 'relatorio-musicas',
    titulo: 'Músicas',
    descricao: 'Catálogo completo com autor, intérprete, categoria, tom e status.',
    gerar: async () => relatoriosService.abrirPdfMusicas(),
  },
  {
    id: 'musicos',
    recurso: 'relatorio-musicos',
    titulo: 'Músicos',
    descricao: 'Cadastro de músicos com WhatsApp, funções/instrumentos e status.',
    gerar: async () => relatoriosService.abrirPdfMusicos(),
  },
  {
    id: 'musicos-escala',
    recurso: 'relatorio-musicos-escala',
    titulo: 'Músicos por escala',
    descricao: 'Participações do mês: celebração, local, músico, função e confirmação.',
    precisaPeriodo: true,
    gerar: async (p) => relatoriosService.abrirPdfMusicosEscala(p),
  },
  {
    id: 'escalas',
    recurso: 'relatorio-escalas',
    titulo: 'Escalas',
    descricao: 'Escalas do mês com músicos escalados e repertório de cada celebração.',
    precisaPeriodo: true,
    gerar: async (p) => relatoriosService.abrirPdfEscalas(p),
  },
  {
    id: 'repertorios',
    recurso: 'relatorio-repertorios',
    titulo: 'Repertórios',
    descricao: 'Repertórios do mês com momentos litúrgicos e músicas.',
    precisaPeriodo: true,
    gerar: async (p) => relatoriosService.abrirPdfRepertorios(p),
  },
  {
    id: 'celebracoes-mes',
    recurso: 'relatorio-celebracoes-mes',
    titulo: 'Celebrações por mês',
    descricao: 'Celebrações do mês com horário, local e status.',
    precisaPeriodo: true,
    gerar: async (p) => relatoriosService.abrirPdfCelebracoesMes(p),
  },
  {
    id: 'musicos-funcoes',
    recurso: 'relatorio-musicos-funcoes',
    titulo: 'Músicos por funções e instrumentos',
    descricao: 'Matriz músico × função/instrumento vinculada.',
    gerar: async () => relatoriosService.abrirPdfMusicosFuncoes(),
  },
];

export default function RelatoriosPage() {
  const { user, loading: authLoading } = useAuth();
  const podePagina = podeAcessarPaginaRelatorios(user);
  const agora = useMemo(() => new Date(), []);
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [gerandoId, setGerandoId] = useState<string | null>(null);

  const anos = useMemo(() => {
    const atual = agora.getFullYear();
    return [atual - 1, atual, atual + 1];
  }, [agora]);

  if (authLoading) {
    return <LoadingSpinner label="Carregando..." />;
  }

  if (!podePagina) {
    return (
      <div className={styles.page}>
        <div>
          <h1 className={dashStyles.welcomeTitle}>Relatórios</h1>
          <p className={styles.intro}>
            Você não tem permissão para acessar relatórios. Solicite ao administrador as permissões do
            módulo Relatórios.
          </p>
        </div>
        <FeedbackMessage variant="warning">
          Permissão necessária: <strong>relatorio.pagina</strong>. Peça ao administrador do sistema
          para liberar o módulo Relatórios no seu grupo.
        </FeedbackMessage>
      </div>
    );
  }

  const handleGerar = async (card: RelatorioCard) => {
    if (!podeGerarRelatorio(user, card.recurso)) {
      notifyError(`Seu grupo não tem permissão para gerar o PDF (${card.recurso}.gerar).`, {
        toastId: `relatorio-sem-permissao-${card.id}`,
      });
      return;
    }
    setGerandoId(card.id);
    try {
      await card.gerar({ ano, mes });
      notifySuccess(`Relatório “${card.titulo}” aberto em nova aba.`);
    } catch (err) {
      const msg = await resolveApiErrorMessage(err);
      notifyError(msg, { toastId: `relatorio-erro-${card.id}` });
    } finally {
      setGerandoId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div>
        <h1 className={dashStyles.welcomeTitle}>Relatórios</h1>
        <p className={styles.intro}>
          PDFs na identidade visual BRMusics (madeira, creme e dourado). Relatórios mensais usam o
          período abaixo.
        </p>
      </div>

      <div className={styles.periodoBar}>
        <label className={styles.periodoCampo}>
          <span>Mês</span>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.periodoCampo}>
          <span>Ano</span>
          <select value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.cardsGrid} role="list" aria-label="Tipos de relatório">
        {RELATORIOS.map((card) => {
          const podeVer = podeVerRelatorio(user, card.recurso);
          const podeGerar = podeGerarRelatorio(user, card.recurso);
          const gerando = gerandoId === card.id;
          if (!podeVer) {
            return (
              <div
                key={card.id}
                className={styles.reportCard}
                role="listitem"
                aria-disabled
                style={{ opacity: 0.55 }}
              >
                <FileBarChart size={28} strokeWidth={1.75} aria-hidden />
                <h2 className={styles.reportCardTitle}>{card.titulo}</h2>
                <p className={styles.reportCardDesc}>
                  Seu grupo não tem acesso a este relatório ({card.recurso}.pagina).
                </p>
                <span className={styles.reportCardAction}>Indisponível</span>
              </div>
            );
          }
          return (
            <button
              key={card.id}
              type="button"
              className={styles.reportCard}
              role="listitem"
              disabled={!podeGerar || gerandoId !== null}
              onClick={() => void handleGerar(card)}
            >
              <FileBarChart size={28} strokeWidth={1.75} aria-hidden />
              <h2 className={styles.reportCardTitle}>{card.titulo}</h2>
              <p className={styles.reportCardDesc}>
                {card.descricao}
                {card.precisaPeriodo ? ' Usa o mês/ano selecionados.' : ''}
              </p>
              <span className={styles.reportCardAction}>
                {gerando ? 'Gerando...' : podeGerar ? 'Abrir PDF →' : 'Sem permissão para gerar'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
