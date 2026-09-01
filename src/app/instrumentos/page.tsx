'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifyError, notifySuccess } from '@/lib/notify';
import { podeListarInstrumentos } from '@/lib/permissions';
import { instrumentosService } from '@/services/instrumentos';
import type { Instrumento, InstrumentoInput } from '@/types/api';
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

const FORM_INICIAL: InstrumentoInput = {
  nome: '',
  descricao: '',
  ativo: true,
  ordem: null,
};

type ModalMode = 'criar' | 'editar' | 'visualizar';

export default function InstrumentosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarInstrumentos(user);

  const [lista, setLista] = useState<Instrumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [nomeDebounced, setNomeDebounced] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('criar');
  const [editCodigo, setEditCodigo] = useState<string | null>(null);
  const [form, setForm] = useState<InstrumentoInput>(FORM_INICIAL);
  const [formLoading, setFormLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [atualizandoAtivo, setAtualizandoAtivo] = useState<string | null>(null);
  const [excluirAlvo, setExcluirAlvo] = useState<Instrumento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNomeDebounced(nome);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [nome]);

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    const ativoParam = filtroAtivo === '' ? undefined : filtroAtivo === 'true';
    instrumentosService
      .listar({
        nome: nomeDebounced,
        ativo: ativoParam,
        page,
        size: pageSize,
        sort: 'ordem',
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
        notifyApiError(err, { toastId: 'instrumentos-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, nomeDebounced, filtroAtivo, page, pageSize]);

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

  const carregar = async (item: Instrumento, mode: ModalMode) => {
    setModalMode(mode);
    setEditCodigo(item.codigo);
    setModalOpen(true);
    setFormLoading(true);
    try {
      const res = await instrumentosService.buscar(item.codigo);
      const i = res.data;
      setForm({
        nome: i.nome ?? '',
        descricao: i.descricao ?? '',
        ativo: i.ativo ?? true,
        ordem: i.ordem ?? null,
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
    async (item: Instrumento, ativo: boolean) => {
      setAtualizandoAtivo(item.codigo);
      try {
        await instrumentosService.atualizarAtivo(item.codigo, ativo);
        notifySuccess(AppMessages.instrumento.ativoAtualizado(ativo));
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
      const body: InstrumentoInput = {
        nome: form.nome.trim(),
        descricao: form.descricao?.trim() || null,
        ativo: form.ativo ?? true,
        ordem: form.ordem == null || Number.isNaN(Number(form.ordem)) ? null : Number(form.ordem),
      };
      if (modalMode === 'editar' && editCodigo) {
        await instrumentosService.atualizar(editCodigo, body);
      } else {
        await instrumentosService.criar(body);
      }
      notifySuccess(AppMessages.instrumento.salvo(modalMode === 'editar'));
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExcluir = async () => {
    if (!excluirAlvo) return;
    setExcluindo(true);
    try {
      await instrumentosService.excluir(excluirAlvo.codigo);
      notifySuccess(AppMessages.instrumento.excluido);
      setExcluirAlvo(null);
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setExcluindo(false);
    }
  };

  const renderAcoes = useCallback(
    (item: Instrumento) => (
      <div className={musicoStyles.cardActions} style={{ borderTop: 'none', paddingTop: 0 }}>
        <PermissionGate permission="instrumento.visualizar">
          <button
            type="button"
            className={listagemStyles.btnAcaoExtra}
            onClick={() => void carregar(item, 'visualizar')}
          >
            <Eye size={14} />
            Visualizar
          </button>
        </PermissionGate>
        <PermissionGate permission="instrumento.editar">
          <button
            type="button"
            className={listagemStyles.btnEditar}
            onClick={() => void carregar(item, 'editar')}
          >
            <Pencil size={14} />
            Editar
          </button>
        </PermissionGate>
        <PermissionGate permission="instrumento.excluir">
          <button type="button" className={listagemStyles.btnExcluir} onClick={() => setExcluirAlvo(item)}>
            Excluir
          </button>
        </PermissionGate>
      </div>
    ),
    []
  );

  const colunas: Coluna<Instrumento>[] = useMemo(
    () => [
      { key: 'nome', label: 'Nome' },
      {
        key: 'descricao',
        label: 'Descrição',
        render: (i) => i.descricao || '—',
      },
      {
        key: 'ordem',
        label: 'Ordem',
        render: (i) => (i.ordem == null ? '—' : String(i.ordem)),
      },
      {
        key: 'ativo',
        label: 'Situação',
        render: (i) => (
          <PermissionGate
            permission="instrumento.editar"
            fallback={<StatusAtivoChip ativo={Boolean(i.ativo)} />}
          >
            <ListagemSwitch
              checked={Boolean(i.ativo)}
              disabled={atualizandoAtivo === i.codigo}
              aria-label={i.ativo ? 'Inativar instrumento' : 'Ativar instrumento'}
              onChange={(checked) => void alterarAtivo(i, checked)}
            />
          </PermissionGate>
        ),
      },
      {
        key: 'acoes',
        label: 'Ações',
        render: renderAcoes,
      },
    ],
    [atualizandoAtivo, alterarAtivo, renderAcoes]
  );

  const somenteLeitura = modalMode === 'visualizar';
  const tituloModal =
    modalMode === 'visualizar'
      ? 'Visualizar instrumento'
      : modalMode === 'editar'
        ? 'Editar instrumento'
        : 'Cadastrar instrumento';

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Instrumentos e funções" />
        <p className="emptyState">
          Você não tem permissão para listar instrumentos. Solicite ao administrador a permissão
          &quot;Listar instrumentos&quot;.
        </p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Instrumentos e funções" />
        <ListagemBar
          searchPlaceholder="Busque por nome"
          searchValue={nome}
          onSearchChange={setNome}
          onLimparFiltros={() => {
            setNome('');
            setFiltroAtivo('');
            setPage(0);
          }}
        >
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-instrumento-ativo">Situação</label>
            <select
              id="filtro-instrumento-ativo"
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
          <PermissionGate permission="instrumento.criar">
            <button type="button" className={listagemStyles.btnCadastrar} onClick={abrirCadastro}>
              Cadastrar
            </button>
          </PermissionGate>
        </ListagemBar>

        {loading && <LoadingSpinner label="Carregando instrumentos..." />}

        {!loading && (
          <ListagemPanel>
            <div className={musicoStyles.desktopOnly}>
              <ListagemTable
                colunas={colunas}
                dados={lista}
                rowKey={(i) => i.codigo}
                emptyMessage="Nenhum instrumento cadastrado. Use Cadastrar para adicionar."
              />
            </div>
            <div className={musicoStyles.mobileCards}>
              {lista.length === 0 ? (
                <p className="emptyState">Nenhum instrumento cadastrado. Use Cadastrar para adicionar.</p>
              ) : (
                lista.map((i) => (
                  <article key={i.codigo} className={musicoStyles.card}>
                    <div className={musicoStyles.cardHeader}>
                      <div>
                        <h3 className={musicoStyles.cardNome}>{i.nome}</h3>
                        {i.descricao ? <p className={musicoStyles.cardArtistico}>{i.descricao}</p> : null}
                      </div>
                      <PermissionGate
                        permission="instrumento.editar"
                        fallback={<StatusAtivoChip ativo={Boolean(i.ativo)} />}
                      >
                        <ListagemSwitch
                          checked={Boolean(i.ativo)}
                          disabled={atualizandoAtivo === i.codigo}
                          aria-label={i.ativo ? 'Inativar instrumento' : 'Ativar instrumento'}
                          onChange={(checked) => void alterarAtivo(i, checked)}
                        />
                      </PermissionGate>
                    </div>
                    <p className={musicoStyles.cardMeta}>Ordem: {i.ordem == null ? '—' : i.ordem}</p>
                    {renderAcoes(i)}
                  </article>
                ))
              )}
            </div>
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="instrumentos"
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
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="instrumento-modal-titulo">
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClose={fecharModal} disabled={salvando} />
            <h2
              id="instrumento-modal-titulo"
              style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 600, paddingRight: '2.5rem' }}
            >
              {tituloModal}
            </h2>
            {formLoading ? (
              <LoadingSpinner label="Carregando instrumento..." />
            ) : somenteLeitura ? (
              <div className={musicoStyles.detailGrid}>
                <div className={musicoStyles.detailItem}>
                  <dt>Nome</dt>
                  <dd>{form.nome || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Descrição</dt>
                  <dd>{form.descricao || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Ordem</dt>
                  <dd>{form.ordem == null ? '—' : form.ordem}</dd>
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
                  <label htmlFor="instrumento-nome">Nome</label>
                  <input
                    id="instrumento-nome"
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    required
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="instrumento-descricao">Descrição</label>
                  <textarea
                    id="instrumento-descricao"
                    className={musicoStyles.textarea}
                    value={form.descricao ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                    maxLength={2000}
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="instrumento-ordem">Ordem</label>
                  <input
                    id="instrumento-ordem"
                    type="number"
                    min={0}
                    value={form.ordem ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ordem: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    placeholder="Automática se vazio"
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
        title="Excluir instrumento"
        message="Se o instrumento já estiver vinculado a músicos, ele será apenas inativado para preservar o histórico."
        confirmLabel="Excluir"
        confirmLoading={excluindo}
        variant="danger"
        onConfirm={() => void confirmarExcluir()}
        onCancel={() => setExcluirAlvo(null)}
      />
    </>
  );
}
