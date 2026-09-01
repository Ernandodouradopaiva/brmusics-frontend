'use client';

import { useState } from 'react';
import { FileBarChart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notifyError, notifySuccess } from '@/lib/notify';
import { resolveApiErrorMessage } from '@/lib/apiError';
import {
  podeAcessarPaginaRelatorios,
  podeAcessarPaginaRelatorioUsuarios,
  podeGerarRelatorioUsuariosPdf,
} from '@/lib/permissions';
import { relatoriosService } from '@/services/relatorios';
import { FeedbackMessage } from '@/components/FeedbackMessage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import dashStyles from '@/app/dashboard/dashboard.module.css';
import styles from './relatorios.module.css';

export default function RelatoriosPage() {
  const { user, loading: authLoading } = useAuth();
  const podePagina = podeAcessarPaginaRelatorios(user);
  const podeUsuarios = podeAcessarPaginaRelatorioUsuarios(user);
  const podeGerar = podeGerarRelatorioUsuariosPdf(user);
  const [gerando, setGerando] = useState(false);

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

  const handleGerarUsuarios = async () => {
    if (!podeGerar) {
      notifyError(
        'Seu grupo não tem permissão para gerar o PDF de usuários (relatorio-usuarios.gerar).',
        { toastId: 'relatorio-usuarios-sem-permissao' },
      );
      return;
    }
    setGerando(true);
    try {
      await relatoriosService.abrirPdfUsuarios();
      notifySuccess('Relatório de usuários aberto em nova aba.');
    } catch (err) {
      const msg = await resolveApiErrorMessage(err);
      notifyError(msg, { toastId: 'relatorio-usuarios-erro' });
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className={styles.page}>
      <div>
        <h1 className={dashStyles.welcomeTitle}>Relatórios</h1>
        <p className={styles.intro}>
          Selecione o relatório desejado. O acesso e a geração de PDF dependem das permissões do seu
          grupo.
        </p>
      </div>

      <div className={styles.cardsGrid} role="list" aria-label="Tipos de relatório">
        {podeUsuarios ? (
          <button
            type="button"
            className={styles.reportCard}
            role="listitem"
            disabled={!podeGerar || gerando}
            onClick={handleGerarUsuarios}
          >
            <FileBarChart size={28} strokeWidth={1.75} aria-hidden />
            <h2 className={styles.reportCardTitle}>Usuários</h2>
            <p className={styles.reportCardDesc}>
              PDF executivo com totais (ativos/inativos) e listagem (CPF, nome, cargo e status).
              Abre em nova aba no visualizador do portal.
            </p>
            <span className={styles.reportCardAction}>
              {gerando ? 'Gerando...' : podeGerar ? 'Abrir PDF →' : 'Sem permissão para gerar'}
            </span>
          </button>
        ) : (
          <div className={styles.reportCard} role="listitem" aria-disabled style={{ opacity: 0.55 }}>
            <FileBarChart size={28} strokeWidth={1.75} aria-hidden />
            <h2 className={styles.reportCardTitle}>Usuários</h2>
            <p className={styles.reportCardDesc}>
              Seu grupo não tem acesso a este relatório (relatorio-usuarios.pagina).
            </p>
            <span className={styles.reportCardAction}>Indisponível</span>
          </div>
        )}
      </div>
    </div>
  );
}
