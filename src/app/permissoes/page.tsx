'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { permissoesService } from '@/services/permissoes';
import { notifyApiError } from '@/lib/notify';
import { podeGerenciarGrupos, podeListarPermissoes } from '@/lib/permissions';
import type { Permissao } from '@/types/api';
import {
  ListagemTitulo,
  ListagemBar,
  ListagemTable,
  ListagemPanel,
  ListagemPageWrapper,
  ListagemPagination,
} from '@/components/listagem';
import type { Coluna } from '@/components/listagem';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import listagemStyles from '@/components/listagem/listagem.module.css';

const DEFAULT_PAGE_SIZE = 5;

const COLUNAS: Coluna<Permissao>[] = [
  { key: 'chave', label: 'Chave', render: (p) => p.chave ?? p.codigo ?? '—' },
  { key: 'nome', label: 'Nome' },
  { key: 'descricao', label: 'Descrição', render: (p) => p.descricao ?? '—' },
  { key: 'modulo', label: 'Módulo', render: (p) => p.modulo ?? '—' },
];

export default function PermissoesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const podeListar = podeListarPermissoes(user);
  const podeAtribuirEmGrupos = podeGerenciarGrupos(user);
  const [lista, setLista] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [busca]);

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    permissoesService
      .listar({ busca: buscaDebounced, page, size: pageSize })
      .then((res) => {
        setLista(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
        setTotalElements(res.data.totalElements ?? 0);
      })
      .catch((err) => {
        setLista([]);
        setTotalPages(0);
        setTotalElements(0);
        notifyApiError(err, { toastId: 'permissoes-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, buscaDebounced, page, pageSize]);

  const alterarTamanhoPagina = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (!podeListar) {
      setLoading(false);
      setLista([]);
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated, podeListar, loadData]);

  if (!authLoading && isAuthenticated && !podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Permissões" />
        <p className={listagemStyles.empty}>
          Você não tem permissão para listar o catálogo de permissões. Solicite ao administrador a permissão
          &quot;Listar permissões&quot;.
        </p>
      </ListagemPageWrapper>
    );
  }

  return (
    <ListagemPageWrapper>
      <ListagemTitulo recurso="Permissões" />
      <p className={listagemStyles.intro}>
        Catálogo funcional de permissões do sistema (somente leitura). Para editar o que cada perfil pode
        fazer, altere as permissões no grupo.
        {podeAtribuirEmGrupos && (
          <>
            {' '}
            <Link href="/grupos" style={{ fontWeight: 700 }}>
              Abrir grupos
            </Link>
          </>
        )}
      </p>
      <ListagemBar
        searchPlaceholder="Busque por chave, nome ou módulo"
        searchValue={busca}
        onSearchChange={setBusca}
        onLimparFiltros={() => {
          setBusca('');
          setPage(0);
        }}
      />
      {loading && <LoadingSpinner label="Carregando permissões..." />}
      {!loading && (
        <ListagemPanel>
          <ListagemTable
            colunas={COLUNAS}
            dados={lista}
            rowKey={(p) => p.codigo}
            emptyMessage="Nenhuma permissão encontrada."
          />
          <ListagemPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            size={pageSize}
            resourceLabel="permissões"
            onPageChange={setPage}
            onSizeChange={alterarTamanhoPagina}
          />
        </ListagemPanel>
      )}
    </ListagemPageWrapper>
  );
}
