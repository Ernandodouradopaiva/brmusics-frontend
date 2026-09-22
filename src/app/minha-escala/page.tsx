'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ListagemPageWrapper, ListagemTitulo } from '@/components/listagem';
import { CardEscalaResumo, CardProximaEscala } from '@/components/musico/MusicoEscalaCards';
import { minhaEscalaService } from '@/services/minhaEscala';
import { notifyApiError } from '@/lib/notify';
import { podeListarMinhaEscala } from '@/lib/permissions';
import type { MinhaEscalaAgenda } from '@/types/api';
import styles from '@/app/musico/musico.module.css';

export default function MinhaEscalaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarMinhaEscala(user);
  const [agenda, setAgenda] = useState<MinhaEscalaAgenda | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      return;
    }
    minhaEscalaService
      .agenda()
      .then((res) => setAgenda(res.data))
      .catch((err) => {
        setAgenda(null);
        notifyApiError(err);
      })
      .finally(() => setLoading(false));
  }, [authLoading, podeListar]);

  if (authLoading || loading) {
    return <LoadingSpinner fullPage label="Carregando escalas..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Minha escala" />
        <p className="emptyState">Você não tem permissão para ver sua escala.</p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  return (
    <ListagemPageWrapper>
      <ListagemTitulo recurso="Minha escala" />
      <p className={styles.secaoTitulo}>Sua próxima escala</p>
      {agenda?.proxima ? (
        <CardProximaEscala item={agenda.proxima} />
      ) : (
        <p className={styles.vazio}>Nenhuma escala futura cadastrada para você.</p>
      )}
      <p className={styles.secaoTitulo}>Próximas escalas</p>
      {(agenda?.proximas ?? []).length > 0 ? (
        <div className={styles.lista}>
          {agenda?.proximas.map((item) => (
            <CardEscalaResumo key={item.escalaCodigo} item={item} />
          ))}
        </div>
      ) : (
        <p className={styles.vazio}>Não há outras escalas futuras.</p>
      )}
      <p className={styles.secaoTitulo}>Histórico</p>
      {(agenda?.historico ?? []).length > 0 ? (
        <div className={styles.lista}>
          {agenda?.historico.map((item) => (
            <CardEscalaResumo key={item.escalaCodigo} item={item} />
          ))}
        </div>
      ) : (
        <p className={styles.vazio}>Ainda não há escalas anteriores.</p>
      )}
    </ListagemPageWrapper>
  );
}
