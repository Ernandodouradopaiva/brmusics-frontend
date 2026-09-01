'use client';

import { useAuth } from '@/contexts/AuthContext';
import styles from '@/app/dashboard/dashboard.module.css';

export default function SemAcessoPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem', maxWidth: 520 }}>
      <h1 className={styles.welcomeTitle}>Sem permissão de acesso</h1>
      <p className={styles.welcomeSubtitle}>
        {user?.nome ? (
          <>
            Olá, <strong>{user.nome}</strong>. Você está autenticado, mas ainda não possui grupos ou permissões
            atribuídos neste projeto.
          </>
        ) : (
          <>Você está autenticado, mas ainda não possui permissões atribuídas neste projeto.</>
        )}
      </p>
      <p className={styles.welcomeSubtitle}>
        Solicite ao administrador do Projeto A a vinculação a um grupo de permissões. Se você acabou de receber o
        acesso, saia e entre novamente para atualizar a sessão.
      </p>
      <button type="button" className="modalBtnPrimary" onClick={() => logout()}>
        Sair
      </button>
    </div>
  );
}
