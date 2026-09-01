'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ListagemPageWrapper, ListagemTitulo } from '@/components/listagem';
import { meuRepertorioService } from '@/services/meuRepertorio';
import { notifyApiError } from '@/lib/notify';
import { podeListarMeuRepertorio } from '@/lib/permissions';
import { formatarDataIso, formatarHoraAmigavel } from '@/lib/musicoFormat';
import type { RepertorioMensalItem } from '@/types/api';
import styles from '@/app/musico/musico.module.css';

export default function MeuRepertorioPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarMeuRepertorio(user);
  const [itens, setItens] = useState<RepertorioMensalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      return;
    }
    meuRepertorioService
      .listar()
      .then((res) => setItens(res.data ?? []))
      .catch((err) => {
        setItens([]);
        notifyApiError(err);
      })
      .finally(() => setLoading(false));
  }, [authLoading, podeListar]);

  if (authLoading || loading) {
    return <LoadingSpinner fullPage label="Carregando repertórios..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Meu repertório" />
        <p className="emptyState">Você não tem permissão para ver seus repertórios.</p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  return (
    <ListagemPageWrapper>
      <ListagemTitulo recurso="Meu repertório" />
      {itens.length === 0 ? (
        <p className={styles.vazio}>Nenhum repertório nas suas escalas publicadas.</p>
      ) : (
        <div className={styles.lista}>
          {itens.map((item) => {
            const href = item.repertorioCodigo
              ? `/meu-repertorio/${item.repertorioCodigo}`
              : `/meu-repertorio/celebracao/${item.celebracaoCodigo}`;
            return (
              <Link key={item.celebracaoCodigo} href={href} className={styles.cardLista}>
                <p className={styles.cardListaTitulo}>{item.titulo}</p>
                <p className={styles.cardListaMeta}>
                  {formatarDataIso(item.data)}
                  {item.horaInicio ? ` • ${formatarHoraAmigavel(item.horaInicio)}` : ''}
                  {item.quantidadeItens ? ` • ${item.quantidadeItens} músicas` : ''}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </ListagemPageWrapper>
  );
}
