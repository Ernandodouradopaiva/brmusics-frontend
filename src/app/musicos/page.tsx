'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifyError, notifySuccess } from '@/lib/notify';
import { formatTelefone, onlyDigits } from '@/lib/masks';
import { podeListarMusicos, podeListarUsuarios } from '@/lib/permissions';
import { musicosService } from '@/services/musicos';
import { usuariosService } from '@/services/usuarios';
import { instrumentosService } from '@/services/instrumentos';
import type { Instrumento, Musico, MusicoInput, UsuarioLocal } from '@/types/api';
import { InstrumentoChipPicker, InstrumentoChips } from '@/components/InstrumentoChipPicker';
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
import listagemStyles from '@/components/listagem/listagem.module.css';
import styles from './musicos.module.css';

const DEFAULT_PAGE_SIZE = 5;

const FORM_INICIAL: MusicoInput = {
  nome: '',
  nomeArtistico: '',
  telefone: '',
  whatsapp: '',
  email: '',
  observacao: '',
  ativo: true,
  usuarioCodigo: '',
  instrumentosCodigos: [],
};

type ModalMode = 'criar' | 'editar' | 'visualizar';

function formatarTelefoneExibicao(valor?: string | null): string {
  if (!valor) return '—';
  return formatTelefone(valor);
}

export default function MusicosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarMusicos(user);
  const podeListarUsuariosSistema = podeListarUsuarios(user);

  const [lista, setLista] = useState<Musico[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [nomeDebounced, setNomeDebounced] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefoneDebounced, setTelefoneDebounced] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('criar');
  const [editCodigo, setEditCodigo] = useState<string | null>(null);
  const [form, setForm] = useState<MusicoInput>(FORM_INICIAL);
  const [formLoading, setFormLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [atualizandoAtivo, setAtualizandoAtivo] = useState<string | null>(null);
  const [usuarioNomeExibicao, setUsuarioNomeExibicao] = useState('');
  const [usuariosOpcoes, setUsuariosOpcoes] = useState<UsuarioLocal[]>([]);
  const [catalogoInstrumentos, setCatalogoInstrumentos] = useState<Instrumento[]>([]);
  const [instrumentosDoMusico, setInstrumentosDoMusico] = useState<Instrumento[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNomeDebounced(nome);
      setTelefoneDebounced(telefone);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [nome, telefone]);

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    const ativoParam =
      filtroAtivo === '' ? undefined : filtroAtivo === 'true';
    musicosService
      .listar({
        nome: nomeDebounced,
        telefone: onlyDigits(telefoneDebounced) || undefined,
        ativo: ativoParam,
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
        notifyApiError(err, { toastId: 'musicos-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, nomeDebounced, telefoneDebounced, filtroAtivo, page, pageSize]);

  const alterarTamanhoPagina = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      setLista([]);
      return;
    }
    loadData();
  }, [authLoading, podeListar, loadData]);

  useEffect(() => {
    if (!modalOpen || modalMode === 'visualizar' || !podeListarUsuariosSistema) {
      return;
    }
    usuariosService
      .listar({ page: 0, size: 100, sort: 'nome' })
      .then((res) => setUsuariosOpcoes((res.data.content ?? []).filter((u) => u.ativo !== false)))
      .catch(() => setUsuariosOpcoes([]));
  }, [modalOpen, modalMode, podeListarUsuariosSistema]);

  useEffect(() => {
    if (!modalOpen || modalMode === 'visualizar') {
      return;
    }
    instrumentosService
      .listar({ page: 0, size: 200, sort: 'ordem' })
      .then((res) => setCatalogoInstrumentos(res.data.content ?? []))
      .catch(() => setCatalogoInstrumentos([]));
  }, [modalOpen, modalMode]);

  const abrirCadastro = () => {
    setModalMode('criar');
    setEditCodigo(null);
    setForm(FORM_INICIAL);
    setUsuarioNomeExibicao('');
    setInstrumentosDoMusico([]);
    setModalOpen(true);
  };

  const carregarMusico = useCallback(async (item: Musico, mode: ModalMode) => {
    setModalMode(mode);
    setEditCodigo(item.codigo);
    setModalOpen(true);
    setFormLoading(true);
    try {
      const res = await musicosService.buscar(item.codigo);
      const m = res.data;
      setForm({
        nome: m.nome ?? '',
        nomeArtistico: m.nomeArtistico ?? '',
        telefone: formatTelefone(m.telefone ?? ''),
        whatsapp: formatTelefone(m.whatsapp ?? ''),
        email: m.email ?? '',
        observacao: m.observacao ?? '',
        ativo: m.ativo ?? true,
        usuarioCodigo: m.usuarioCodigo ?? '',
        instrumentosCodigos: (m.instrumentos ?? []).map((i) => i.codigo),
      });
      setUsuarioNomeExibicao(m.usuarioNome ?? '');
      setInstrumentosDoMusico(m.instrumentos ?? []);
    } catch (err) {
      notifyApiError(err);
      setModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  }, []);

  const fecharModal = () => {
    if (salvando) return;
    setModalOpen(false);
    setEditCodigo(null);
    setForm(FORM_INICIAL);
    setUsuarioNomeExibicao('');
    setInstrumentosDoMusico([]);
  };

  const alterarAtivo = useCallback(
    async (musico: Musico, ativo: boolean) => {
      setAtualizandoAtivo(musico.codigo);
      try {
        await musicosService.atualizarAtivo(musico.codigo, ativo);
        notifySuccess(AppMessages.musico.ativoAtualizado(ativo));
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
    if (!onlyDigits(form.whatsapp).trim()) {
      notifyError(AppMessages.validacao.campoObrigatorio('o WhatsApp'));
      return;
    }
    setSalvando(true);
    try {
      const body: MusicoInput = {
        nome: form.nome.trim(),
        nomeArtistico: form.nomeArtistico?.trim() || null,
        telefone: onlyDigits(form.telefone ?? '') || null,
        whatsapp: onlyDigits(form.whatsapp),
        email: form.email?.trim() || null,
        observacao: form.observacao?.trim() || null,
        ativo: form.ativo ?? true,
        usuarioCodigo: form.usuarioCodigo?.trim() || null,
        instrumentosCodigos: form.instrumentosCodigos ?? [],
      };
      if (modalMode === 'editar' && editCodigo) {
        await musicosService.atualizar(editCodigo, body);
      } else {
        await musicosService.criar(body);
      }
      notifySuccess(AppMessages.musico.salvo(modalMode === 'editar'));
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  const renderAcoes = useCallback((item: Musico) => (
    <div className={styles.cardActions} style={{ borderTop: 'none', paddingTop: 0 }}>
      <PermissionGate permission="musico.visualizar">
        <button
          type="button"
          className={listagemStyles.btnAcaoExtra}
          onClick={() => void carregarMusico(item, 'visualizar')}
        >
          <Eye size={14} />
          Visualizar
        </button>
      </PermissionGate>
      <PermissionGate permission="musico.editar">
        <button
          type="button"
          className={listagemStyles.btnEditar}
          onClick={() => void carregarMusico(item, 'editar')}
        >
          <Pencil size={14} />
          Editar
        </button>
      </PermissionGate>
    </div>
  ), [carregarMusico]);

  const colunas: Coluna<Musico>[] = useMemo(
    () => [
      { key: 'nome', label: 'Nome' },
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        render: (m) => formatarTelefoneExibicao(m.whatsapp),
      },
      {
        key: 'instrumentos',
        label: 'Instrumentos',
        render: (m) => <InstrumentoChips instrumentos={m.instrumentos} />,
      },
      {
        key: 'ativo',
        label: 'Situação',
        render: (m) => (
          <PermissionGate
            permission="musico.editar"
            fallback={<StatusAtivoChip ativo={Boolean(m.ativo)} />}
          >
            <ListagemSwitch
              checked={Boolean(m.ativo)}
              disabled={atualizandoAtivo === m.codigo}
              aria-label={m.ativo ? 'Inativar músico' : 'Ativar músico'}
              onChange={(checked) => void alterarAtivo(m, checked)}
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
    modalMode === 'visualizar' ? 'Visualizar músico' : modalMode === 'editar' ? 'Editar músico' : 'Cadastrar músico';

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Músicos" />
        <p className="emptyState">
          Você não tem permissão para listar músicos. Solicite ao administrador a permissão &quot;Listar
          músicos&quot;.
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
        <ListagemTitulo recurso="Músicos" />
        <ListagemBar
          searchPlaceholder="Busque por nome"
          searchValue={nome}
          onSearchChange={setNome}
          onLimparFiltros={() => {
            setNome('');
            setTelefone('');
            setFiltroAtivo('');
            setPage(0);
          }}
        >
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-telefone">Telefone</label>
            <div className={listagemStyles.barFiltroInline}>
              <input
                id="filtro-telefone"
                type="text"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              />
            </div>
          </div>
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-ativo">Situação</label>
            <select
              id="filtro-ativo"
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
          <PermissionGate permission="musico.criar">
            <button type="button" className={listagemStyles.btnCadastrar} onClick={abrirCadastro}>
              Cadastrar
            </button>
          </PermissionGate>
        </ListagemBar>

        {loading && <LoadingSpinner label="Carregando músicos..." />}

        {!loading && (
          <ListagemPanel>
            <div className={styles.desktopOnly}>
              <ListagemTable
                colunas={colunas}
                dados={lista}
                rowKey={(m) => m.codigo}
                emptyMessage="Nenhum músico cadastrado. Use Cadastrar para adicionar."
              />
            </div>
            <div className={styles.mobileCards}>
              {lista.length === 0 ? (
                <p className="emptyState">Nenhum músico cadastrado. Use Cadastrar para adicionar.</p>
              ) : (
                lista.map((m) => (
                  <article key={m.codigo} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.cardNome}>{m.nome}</h3>
                        {m.nomeArtistico ? (
                          <p className={styles.cardArtistico}>{m.nomeArtistico}</p>
                        ) : null}
                      </div>
                      <PermissionGate
                        permission="musico.editar"
                        fallback={<StatusAtivoChip ativo={Boolean(m.ativo)} />}
                      >
                        <ListagemSwitch
                          checked={Boolean(m.ativo)}
                          disabled={atualizandoAtivo === m.codigo}
                          aria-label={m.ativo ? 'Inativar músico' : 'Ativar músico'}
                          onChange={(checked) => void alterarAtivo(m, checked)}
                        />
                      </PermissionGate>
                    </div>
                    <p className={styles.cardMeta}>WhatsApp: {formatarTelefoneExibicao(m.whatsapp)}</p>
                    <div className={styles.cardMeta}>
                      <InstrumentoChips instrumentos={m.instrumentos} />
                    </div>
                    {renderAcoes(m)}
                  </article>
                ))
              )}
            </div>
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="músicos"
              onPageChange={setPage}
              onSizeChange={alterarTamanhoPagina}
            />
          </ListagemPanel>
        )}
      </ListagemPageWrapper>

      {modalOpen && (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="musico-modal-titulo">
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClose={fecharModal} disabled={salvando} />
            <h2
              id="musico-modal-titulo"
              style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 600, paddingRight: '2.5rem' }}
            >
              {tituloModal}
            </h2>
            {formLoading ? (
              <LoadingSpinner label="Carregando músico..." />
            ) : somenteLeitura ? (
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <dt>Nome</dt>
                  <dd>{form.nome || '—'}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt>Nome artístico</dt>
                  <dd>{form.nomeArtistico || '—'}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt>WhatsApp</dt>
                  <dd>{form.whatsapp || '—'}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt>Telefone</dt>
                  <dd>{form.telefone || '—'}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt>E-mail</dt>
                  <dd>{form.email || '—'}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt>Usuário vinculado</dt>
                  <dd>{usuarioNomeExibicao || 'Nenhum'}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt>Instrumentos</dt>
                  <dd>
                    <InstrumentoChips instrumentos={instrumentosDoMusico} emptyLabel="Nenhum" />
                  </dd>
                </div>
                <div className={styles.detailItem}>
                  <dt>Observação</dt>
                  <dd>{form.observacao || '—'}</dd>
                </div>
                <div className={styles.detailItem}>
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
                  <label htmlFor="musico-nome">Nome</label>
                  <input
                    id="musico-nome"
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    required
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="musico-nome-artistico">Nome artístico</label>
                  <input
                    id="musico-nome-artistico"
                    type="text"
                    value={form.nomeArtistico ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, nomeArtistico: e.target.value }))}
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="musico-whatsapp">WhatsApp</label>
                  <input
                    id="musico-whatsapp"
                    type="tel"
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: formatTelefone(e.target.value) }))}
                    required
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="musico-telefone">Telefone</label>
                  <input
                    id="musico-telefone"
                    type="tel"
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    value={form.telefone ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, telefone: formatTelefone(e.target.value) }))}
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="musico-email">E-mail</label>
                  <input
                    id="musico-email"
                    type="email"
                    value={form.email ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                {podeListarUsuariosSistema && (
                  <div className="modalFormRow">
                    <label htmlFor="musico-usuario">Usuário do sistema (opcional)</label>
                    <select
                      id="musico-usuario"
                      className={styles.select}
                      value={form.usuarioCodigo ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, usuarioCodigo: e.target.value }))}
                    >
                      <option value="">Sem vínculo</option>
                      {form.usuarioCodigo
                        && !usuariosOpcoes.some((u) => u.codigo === form.usuarioCodigo) && (
                          <option value={form.usuarioCodigo}>
                            {usuarioNomeExibicao || 'Usuário vinculado'}
                          </option>
                        )}
                      {usuariosOpcoes.map((u) => (
                        <option key={u.codigo} value={u.codigo}>
                          {u.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="modalFormRow">
                  <label>Instrumentos e funções</label>
                  <InstrumentoChipPicker
                    opcoes={catalogoInstrumentos
                      .filter((i) => i.ativo !== false || (form.instrumentosCodigos ?? []).includes(i.codigo))
                      .concat(
                        instrumentosDoMusico.filter(
                          (hist) => !catalogoInstrumentos.some((c) => c.codigo === hist.codigo)
                        )
                      )
                      .map((i) => ({ codigo: i.codigo, nome: i.nome, ativo: i.ativo }))}
                    selecionados={form.instrumentosCodigos ?? []}
                    onChange={(codigos) => setForm((f) => ({ ...f, instrumentosCodigos: codigos }))}
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="musico-observacao">Observação</label>
                  <textarea
                    id="musico-observacao"
                    className={styles.textarea}
                    value={form.observacao ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                    maxLength={2000}
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
    </>
  );
}
