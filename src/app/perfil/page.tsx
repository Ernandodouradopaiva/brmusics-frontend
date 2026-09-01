'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlterarSenhaModal } from '@/components/AlterarSenhaModal';
import { ListagemPageWrapper, ListagemTitulo } from '@/components/listagem';
import styles from '@/app/musico/musico.module.css';

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const [alterarSenhaOpen, setAlterarSenhaOpen] = useState(false);

  return (
    <ListagemPageWrapper>
      <ListagemTitulo recurso="Perfil" />
      <article className={styles.cardDestaque}>
        <div className={styles.perfilLinha}>
          <p className={styles.rotulo}>Nome</p>
          <p className={styles.valor}>{user?.nome || '—'}</p>
        </div>
        <div className={styles.perfilLinha}>
          <p className={styles.rotulo}>Grupo</p>
          <p className={styles.valor}>{user?.grupoNome || user?.roles?.[0] || '—'}</p>
        </div>
        <div className={styles.perfilAcoes}>
          {user?.codigo && (
            <button type="button" className={styles.btnRepertorio} onClick={() => setAlterarSenhaOpen(true)}>
              Alterar senha
            </button>
          )}
          <button type="button" className="modalBtnSecondary" onClick={() => logout()}>
            Sair
          </button>
        </div>
      </article>
      {alterarSenhaOpen && user?.codigo && (
        <AlterarSenhaModal codigoUsuario={user.codigo} onClose={() => setAlterarSenhaOpen(false)} />
      )}
    </ListagemPageWrapper>
  );
}
