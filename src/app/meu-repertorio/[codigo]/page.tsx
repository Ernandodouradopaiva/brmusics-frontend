'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ListagemPageWrapper, ListagemTitulo } from '@/components/listagem';
import { meuRepertorioService } from '@/services/meuRepertorio';
import { notifyApiError } from '@/lib/notify';
import { usuarioPodeAcessarPagina } from '@/lib/permissions';
import { formatarDataIso, formatarHoraAmigavel } from '@/lib/musicoFormat';
import type { Repertorio } from '@/types/api';
import styles from '@/app/musico/musico.module.css';

function RepertorioDetalhe({ repertorio }: { repertorio: Repertorio }) {
  return (
    <article className={styles.cardDestaque}>
      <p className={styles.cardData}>{formatarDataIso(repertorio.data)}</p>
      <p className={styles.cardMeta}>
        {[repertorio.diaSemana, formatarHoraAmigavel(repertorio.horaInicio)].filter(Boolean).join(' • ')}
      </p>
      <h3 className={styles.cardTitulo}>{repertorio.celebracaoTitulo}</h3>
      {(repertorio.itens ?? []).length === 0 ? (
        <p className={styles.vazio}>Nenhuma música neste repertório.</p>
      ) : (
        <ul className={styles.repertorioLista}>
          {repertorio.itens.map((item) => (
            <li key={item.codigo ?? `${item.momentoLiturgico}-${item.musicaTitulo}`} className={styles.repertorioItem}>
              <p className={styles.repertorioMomento}>{item.momentoLiturgicoRotulo || item.momentoLiturgico}</p>
              <p className={styles.repertorioTitulo}>
                {item.musicaTitulo}
                {item.tom ? ` — Tom ${item.tom}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function MeuRepertorioDetalhePage() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeVer = usuarioPodeAcessarPagina(user, 'meu-repertorio');
  const [repertorio, setRepertorio] = useState<Repertorio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !params.codigo) return;
    if (!podeVer) {
      setLoading(false);
      return;
    }
    meuRepertorioService
      .buscar(params.codigo)
      .then((res) => setRepertorio(res.data))
      .catch((err) => {
        setRepertorio(null);
        notifyApiError(err);
      })
      .finally(() => setLoading(false));
  }, [authLoading, params.codigo, podeVer]);

  if (authLoading || loading) {
    return <LoadingSpinner fullPage label="Carregando repertório..." />;
  }

  return (
    <ListagemPageWrapper>
      <ListagemTitulo recurso="Meu repertório" />
      {repertorio ? <RepertorioDetalhe repertorio={repertorio} /> : <p className="emptyState">Repertório não encontrado.</p>}
      <button type="button" className="modalBtnSecondary" onClick={() => router.push('/meu-repertorio')}>
        Voltar
      </button>
    </ListagemPageWrapper>
  );
}
