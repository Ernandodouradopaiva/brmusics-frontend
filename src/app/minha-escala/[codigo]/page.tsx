'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ListagemPageWrapper, ListagemTitulo } from '@/components/listagem';
import { CardProximaEscala } from '@/components/musico/MusicoEscalaCards';
import { minhaEscalaService } from '@/services/minhaEscala';
import { notifyApiError } from '@/lib/notify';
import { usuarioPodeAcessarPagina } from '@/lib/permissions';
import type { MinhaEscalaItem } from '@/types/api';

export default function MinhaEscalaDetalhePage() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeVer = usuarioPodeAcessarPagina(user, 'minha-escala');
  const [item, setItem] = useState<MinhaEscalaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !params.codigo) return;
    if (!podeVer) {
      setLoading(false);
      return;
    }
    minhaEscalaService
      .buscar(params.codigo)
      .then((res) => setItem(res.data))
      .catch((err) => {
        setItem(null);
        notifyApiError(err);
      })
      .finally(() => setLoading(false));
  }, [authLoading, params.codigo, podeVer]);

  if (authLoading || loading) {
    return <LoadingSpinner fullPage label="Carregando escala..." />;
  }

  return (
    <ListagemPageWrapper>
      <ListagemTitulo recurso="Minha escala" />
      {item ? (
        <CardProximaEscala item={item} />
      ) : (
        <p className="emptyState">Escala não encontrada.</p>
      )}
      <button type="button" className="modalBtnSecondary" onClick={() => router.push('/minha-escala')}>
        Voltar
      </button>
    </ListagemPageWrapper>
  );
}
