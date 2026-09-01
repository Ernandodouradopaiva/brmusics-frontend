'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifyError, notifySuccess } from '@/lib/notify';
import { podeListarLocais } from '@/lib/permissions';
import { locaisService } from '@/services/locais';
import type { Local, LocalInput } from '@/types/api';
import {
  ListagemTitulo,
  ListagemBar,
  ListagemTable,
  ListagemPanel,
  ListagemPageWrapper,
  ListagemPagination,
  ListagemSwitch,
} from '@/components/listagem';
import type { Coluna } from '@/components/listagem';
import { StatusAtivoChip } from '@/components/StatusAtivoChip';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import listagemStyles from '@/components/listagem/listagem.module.css';
import musicoStyles from '@/app/musicos/musicos.module.css';

const DEFAULT_PAGE_SIZE = 5;

const FORM_INICIAL: LocalInput = {
  nome: '',
  endereco: '',
  bairro: '',
  cidade: '',
  observacao: '',
  ativo: true,
};

type ModalMode = 'criar' | 'editar' | 'visualizar';

export default function LocaisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarLocais(user);

  const [lista, setLista] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [nomeDebounced, setNomeDebounced] = useState('');
  const [cidade, setCidade] = useState('');
  const [cidadeDebounced, setCidadeDebounced] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('criar');
  const [editCodigo, setEditCodigo] = useState<string | null>(null);
  const [form, setForm] = useState<LocalInput>(FORM_INICIAL);
  const [formLoading, setFormLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [atualizandoAtivo, setAtualizandoAtivo] = useState<string | null>(null);
  const [excluirAlvo, setExcluirAlvo] = useState<Local | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNomeDebounced(nome);
      setCidadeDebounced(cidade);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [nome, cidade]);

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    locaisService
      .listar({
        nome: nomeDebounced,
        cidade: cidadeDebounced,
        ativo: filtroAtivo === '' ? undefined : filtroAtivo === 'true',
        page,
        size: pageSize,
      })
      .then((res) => {
        setLista(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
        setTotalElements(res.data.totalElements ?? 0);
      })
      .catch((err) => {
        setLista([]);
        setTotalPages(0);
        setTotalElements(0);
        notifyApiError(err, { toastId: 'locais-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, nomeDebounced, cidadeDebounced, filtroAtivo, page, pageSize]);

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      setLista([]);
      return;
    }
    loadData();
  }, [authLoading, podeListar, loadData]);

  const abrirCadastro = () => {
    setModalMode('criar');
    setEditCodigo(null);
    setForm(FORM_INICIAL);
    setModalOpen(true);
  };

  const carregar = async (item: Local, mode: ModalMode) => {
    setModalMode(mode);
    setEditCodigo(item.codigo);
    setModalOpen(true);
    setFormLoading(true);
    try {
      const res = await locaisService.buscar(item.codigo);
      const l = res.data;
      setForm({
        nome: l.nome ?? '',
        endereco: l.endereco ?? '',
        bairro: l.bairro ?? '',
        cidade: l.cidade ?? '',
        observacao: l.observacao ?? '',
        ativo: l.ativo ?? true,
      });
    } catch (err) {
      notifyApiError(err);
      setModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalOpen(false);
    setEditCodigo(null);
    setForm(FORM_INICIAL);
  };

  const alterarAtivo = useCallback(
    async (item: Local, ativo: boolean) => {
      setAtualizandoAtivo(item.codigo);
      try {
        await locaisService.atualizarAtivo(item.codigo, ativo);
        notifySuccess(AppMessages.local.ativoAtualizado(ativo));
        loadData();
      } catch (err) {
        notifyApiError(err);
      } finally {
        setAtualizandoAtivo(null);
      }
    },
    [loadData]
  );

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'visualizar') return;
    if (!form.nome.trim()) {
      notifyError(AppMessages.validacao.campoObrigatorio('o nome'));
      return;
    }
    setSalvando(true);
    try {
      const body: LocalInput = {
        nome: form.nome.trim(),
        endereco: form.endereco?.trim() || null,
        bairro: form.bairro?.trim() || null,
        cidade: form.cidade?.trim() || null,
        observacao: form.observacao?.trim() || null,
        ativo: form.ativo ?? true,
      };
      if (modalMode === 'editar' && editCodigo) {
        await locaisService.atualizar(editCodigo, body);
      } else {
        await locaisService.criar(body);
      }
      notifySuccess(AppMessages.local.salvo(modalMode === 'editar'));
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  const renderAcoes = useCallback(
    (item: Local) => (
      <div className={musicoStyles.cardActions} style={{ borderTop: 'none', paddingTop: 0 }}>
        <PermissionGate permission="local.visualizar">
          <button type="button" className={listagemStyles.btnAcaoExtra} onClick={() => void carregar(item, 'visualizar')}>
            <Eye size={14} />
            Visualizar
          </button>
        </PermissionGate>
        <PermissionGate permission="local.editar">
          <button type="button" className={listagemStyles.btnEditar} onClick={() => void carregar(item, 'editar')}>
            <Pencil size={14} />
            Editar
          </button>
        </PermissionGate>
        <PermissionGate permission="local.excluir">
          <button type="button" className={listagemStyles.btnExcluir} onClick={() => setExcluirAlvo(item)}>
            Excluir
          </button>
        </PermissionGate>
      </div>
    ),
    []
  );

  const colunas: Coluna<Local>[] = useMemo(
    () => [
      { key: 'nome', label: 'Nome' },
      { key: 'cidade', label: 'Cidade', render: (l) => l.cidade || '—' },
      { key: 'bairro', label: 'Bairro', render: (l) => l.bairro || '—' },
      {
        key: 'ativo',
        label: 'Situação',
        render: (l) => (
          <PermissionGate permission="local.editar" fallback={<StatusAtivoChip ativo={Boolean(l.ativo)} />}>
            <ListagemSwitch
              checked={Boolean(l.ativo)}
              disabled={atualizandoAtivo === l.codigo}
              aria-label={l.ativo ? 'Inativar local' : 'Ativar local'}
              onChange={(checked) => void alterarAtivo(l, checked)}
            />
          </PermissionGate>
        ),
      },
      { key: 'acoes', label: 'Ações', render: renderAcoes },
    ],
    [atualizandoAtivo, alterarAtivo, renderAcoes]
  );

  const somenteLeitura = modalMode === 'visualizar';
  const tituloModal =
    modalMode === 'visualizar' ? 'Visualizar local' : modalMode === 'editar' ? 'Editar local' : 'Cadastrar local';

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Locais" />
        <p className="emptyState">Você não tem permissão para listar locais.</p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Locais" />
        <ListagemBar
          searchPlaceholder="Busque por nome"
          searchValue={nome}
          onSearchChange={setNome}
          onLimparFiltros={() => {
            setNome('');
            setCidade('');
            setFiltroAtivo('');
            setPage(0);
          }}
        >
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-cidade">Cidade</label>
            <div className={listagemStyles.barFiltroInline}>
              <input id="filtro-cidade" type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
          </div>
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-local-ativo">Situação</label>
            <select
              id="filtro-local-ativo"
              className={listagemStyles.barSelect}
              value={filtroAtivo}
              onChange={(e) => {
                setFiltroAtivo(e.target.value as '' | 'true' | 'false');
                setPage(0);
              }}
            >
              <option value="">Todas</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
          <PermissionGate permission="local.criar">
            <button type="button" className={listagemStyles.btnCadastrar} onClick={abrirCadastro}>
              Cadastrar
            </button>
          </PermissionGate>
        </ListagemBar>

        {loading && <LoadingSpinner label="Carregando locais..." />}

        {!loading && (
          <ListagemPanel>
            <div className={musicoStyles.desktopOnly}>
              <ListagemTable
                colunas={colunas}
                dados={lista}
                rowKey={(l) => l.codigo}
                emptyMessage="Nenhum local cadastrado."
              />
            </div>
            <div className={musicoStyles.mobileCards}>
              {lista.length === 0 ? (
                <p className="emptyState">Nenhum local cadastrado.</p>
              ) : (
                lista.map((l) => (
                  <article key={l.codigo} className={musicoStyles.card}>
                    <div className={musicoStyles.cardHeader}>
                      <div>
                        <h3 className={musicoStyles.cardNome}>{l.nome}</h3>
                        <p className={musicoStyles.cardArtistico}>
                          {[l.bairro, l.cidade].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <PermissionGate permission="local.editar" fallback={<StatusAtivoChip ativo={Boolean(l.ativo)} />}>
                        <ListagemSwitch
                          checked={Boolean(l.ativo)}
                          disabled={atualizandoAtivo === l.codigo}
                          aria-label={l.ativo ? 'Inativar local' : 'Ativar local'}
                          onChange={(checked) => void alterarAtivo(l, checked)}
                        />
                      </PermissionGate>
                    </div>
                    {l.endereco ? <p className={musicoStyles.cardMeta}>{l.endereco}</p> : null}
                    {renderAcoes(l)}
                  </article>
                ))
              )}
            </div>
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="locais"
              onPageChange={setPage}
              onSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </ListagemPanel>
        )}
      </ListagemPageWrapper>

      {modalOpen && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClose={fecharModal} disabled={salvando} />
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 600, paddingRight: '2.5rem' }}>
              {tituloModal}
            </h2>
            {formLoading ? (
              <LoadingSpinner label="Carregando local..." />
            ) : somenteLeitura ? (
              <div className={musicoStyles.detailGrid}>
                <div className={musicoStyles.detailItem}>
                  <dt>Nome</dt>
                  <dd>{form.nome || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Endereço</dt>
                  <dd>{form.endereco || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Bairro</dt>
                  <dd>{form.bairro || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Cidade</dt>
                  <dd>{form.cidade || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Observação</dt>
                  <dd>{form.observacao || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Situação</dt>
                  <dd>
                    <StatusAtivoChip ativo={Boolean(form.ativo)} />
                  </dd>
                </div>
                <div className="modalActions">
                  <button type="button" className="modalBtnSecondary" onClick={fecharModal}>
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void salvar(e)}>
                <div className="modalFormRow">
                  <label htmlFor="local-nome">Nome</label>
                  <input id="local-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="local-endereco">Endereço</label>
                  <input id="local-endereco" value={form.endereco ?? ''} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="local-bairro">Bairro</label>
                  <input id="local-bairro" value={form.bairro ?? ''} onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))} />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="local-cidade">Cidade</label>
                  <input id="local-cidade" value={form.cidade ?? ''} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="local-observacao">Observação</label>
                  <textarea
                    id="local-observacao"
                    className={musicoStyles.textarea}
                    value={form.observacao ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                  />
                </div>
                <div className="modalActions">
                  <button type="button" className="modalBtnSecondary" onClick={fecharModal} disabled={salvando}>
                    Cancelar
                  </button>
                  <button type="submit" className="modalBtnPrimary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(excluirAlvo)}
        title="Excluir local"
        message="Se o local já tiver celebrações, ele será apenas inativado para preservar o histórico."
        confirmLabel="Excluir"
        confirmLoading={excluindo}
        variant="danger"
        onConfirm={() => {
          if (!excluirAlvo) return;
          setExcluindo(true);
          locaisService
            .excluir(excluirAlvo.codigo)
            .then(() => {
              notifySuccess(AppMessages.local.excluido);
              setExcluirAlvo(null);
              loadData();
            })
            .catch((err) => notifyApiError(err))
            .finally(() => setExcluindo(false));
        }}
        onCancel={() => setExcluirAlvo(null)}
      />
    </>
  );
}
