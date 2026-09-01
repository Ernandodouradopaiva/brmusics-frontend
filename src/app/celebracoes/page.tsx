'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifyError, notifySuccess } from '@/lib/notify';
import { podeListarCelebracoes } from '@/lib/permissions';
import { celebracoesService } from '@/services/celebracoes';
import { locaisService } from '@/services/locais';
import type { Celebracao, CelebracaoInput, CelebracaoStatus, Local } from '@/types/api';
import {
  ListagemTitulo,
  ListagemBar,
  ListagemPanel,
  ListagemPageWrapper,
  ListagemPagination,
} from '@/components/listagem';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import listagemStyles from '@/components/listagem/listagem.module.css';
import musicoStyles from '@/app/musicos/musicos.module.css';
import styles from './celebracoes.module.css';

const DEFAULT_PAGE_SIZE = 5;
const TITULOS_SUGERIDOS = [
  'Missa Dominical',
  'Missa de Domingo',
  'Missa de Nossa Senhora',
  'Celebração de Casamento',
  'Adoração',
  'Celebração Especial',
];
const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const STATUS_OPCOES: { value: CelebracaoStatus; label: string }[] = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PUBLICADA', label: 'Publicada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'REALIZADA', label: 'Realizada' },
];

type ModalMode = 'criar' | 'editar' | 'visualizar';
type Destaque = 'futura' | 'realizada' | 'cancelada' | 'rascunho';

const agora = () => new Date();

function horaInput(valor?: string | null): string {
  if (!valor) return '';
  return valor.slice(0, 5);
}

function formatarData(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function classificar(c: Celebracao): Destaque {
  if (c.status === 'CANCELADA') return 'cancelada';
  if (c.status === 'REALIZADA') return 'realizada';
  const hora = horaInput(c.horaInicio) || '00:00';
  const inicio = new Date(`${c.data}T${hora}:00`);
  if (!Number.isNaN(inicio.getTime()) && inicio.getTime() >= agora().getTime()) {
    return 'futura';
  }
  return 'rascunho';
}

function labelStatus(status: CelebracaoStatus): string {
  return STATUS_OPCOES.find((s) => s.value === status)?.label ?? status;
}

function badgeClass(d: Destaque): string {
  if (d === 'futura') return `${styles.badge} ${styles.badgeFutura}`;
  if (d === 'realizada') return `${styles.badge} ${styles.badgeRealizada}`;
  if (d === 'cancelada') return `${styles.badge} ${styles.badgeCancelada}`;
  return `${styles.badge} ${styles.badgeRascunho}`;
}

function cardClass(d: Destaque): string {
  if (d === 'futura') return `${styles.card} ${styles.futura}`;
  if (d === 'realizada') return `${styles.card} ${styles.realizada}`;
  if (d === 'cancelada') return `${styles.card} ${styles.cancelada}`;
  return `${styles.card} ${styles.rascunho}`;
}

function labelDestaque(d: Destaque): string {
  if (d === 'futura') return 'Futura';
  if (d === 'realizada') return 'Realizada';
  if (d === 'cancelada') return 'Cancelada';
  return 'Rascunho / outras';
}

const FORM_INICIAL: CelebracaoInput = {
  localCodigo: '',
  titulo: '',
  data: '',
  horaInicio: '',
  horaFim: '',
  descricao: '',
  observacao: '',
  status: 'RASCUNHO',
};

export default function CelebracoesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarCelebracoes(user);
  const hoje = useMemo(() => new Date(), []);

  const [lista, setLista] = useState<Celebracao[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [tituloDebounced, setTituloDebounced] = useState('');
  const [mes, setMes] = useState<number>(hoje.getMonth() + 1);
  const [ano, setAno] = useState<number>(hoje.getFullYear());
  const [localCodigo, setLocalCodigo] = useState('');
  const [status, setStatus] = useState<'' | CelebracaoStatus>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('criar');
  const [editCodigo, setEditCodigo] = useState<string | null>(null);
  const [form, setForm] = useState<CelebracaoInput>(FORM_INICIAL);
  const [formLoading, setFormLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluirAlvo, setExcluirAlvo] = useState<Celebracao | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTituloDebounced(titulo);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [titulo]);

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    celebracoesService
      .listar({
        titulo: tituloDebounced,
        mes,
        ano,
        localCodigo: localCodigo || undefined,
        status: status || undefined,
        page,
        size: pageSize,
        sort: 'data,desc',
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
        notifyApiError(err, { toastId: 'celebracoes-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, tituloDebounced, mes, ano, localCodigo, status, page, pageSize]);

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
    locaisService
      .listar({ page: 0, size: 200, sort: 'nome', ativo: true })
      .then((res) => setLocais(res.data.content ?? []))
      .catch(() => setLocais([]));
  }, []);

  const abrirCadastro = () => {
    setModalMode('criar');
    setEditCodigo(null);
    setForm(FORM_INICIAL);
    setModalOpen(true);
  };

  const carregar = async (item: Celebracao, mode: ModalMode) => {
    setModalMode(mode);
    setEditCodigo(item.codigo);
    setModalOpen(true);
    setFormLoading(true);
    try {
      const res = await celebracoesService.buscar(item.codigo);
      const c = res.data;
      setForm({
        localCodigo: c.localCodigo ?? '',
        titulo: c.titulo ?? '',
        data: c.data ?? '',
        horaInicio: horaInput(c.horaInicio),
        horaFim: horaInput(c.horaFim),
        descricao: c.descricao ?? '',
        observacao: c.observacao ?? '',
        status: c.status ?? 'RASCUNHO',
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

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'visualizar') return;
    if (!form.titulo.trim() || !form.localCodigo || !form.data || !form.horaInicio) {
      notifyError(AppMessages.validacao.campoObrigatorio('título, local, data e horário de início'));
      return;
    }
    setSalvando(true);
    try {
      const body: CelebracaoInput = {
        localCodigo: form.localCodigo,
        titulo: form.titulo.trim(),
        data: form.data,
        horaInicio: form.horaInicio,
        horaFim: form.horaFim || null,
        descricao: form.descricao?.trim() || null,
        observacao: form.observacao?.trim() || null,
        status: form.status ?? 'RASCUNHO',
      };
      if (modalMode === 'editar' && editCodigo) {
        await celebracoesService.atualizar(editCodigo, body);
      } else {
        await celebracoesService.criar(body);
      }
      notifySuccess(AppMessages.celebracao.salvo(modalMode === 'editar'));
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  const anos = useMemo(() => {
    const atual = hoje.getFullYear();
    return [atual - 1, atual, atual + 1, atual + 2];
  }, [hoje]);

  const locaisDoForm = useMemo(() => {
    if (form.localCodigo && !locais.some((l) => l.codigo === form.localCodigo)) {
      return [{ codigo: form.localCodigo, nome: 'Local vinculado', id: 0 } as Local, ...locais];
    }
    return locais;
  }, [form.localCodigo, locais]);

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Celebrações" />
        <p className="emptyState">Você não tem permissão para listar celebrações.</p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  const somenteLeitura = modalMode === 'visualizar';
  const tituloModal =
    modalMode === 'visualizar'
      ? 'Visualizar celebração'
      : modalMode === 'editar'
        ? 'Editar celebração'
        : 'Cadastrar celebração';

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Celebrações" />
        <ListagemBar
          searchPlaceholder="Busque por título"
          searchValue={titulo}
          onSearchChange={setTitulo}
          onLimparFiltros={() => {
            setTitulo('');
            setMes(hoje.getMonth() + 1);
            setAno(hoje.getFullYear());
            setLocalCodigo('');
            setStatus('');
            setPage(0);
          }}
        >
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-mes">Mês</label>
            <select
              id="filtro-mes"
              className={listagemStyles.barSelect}
              value={mes}
              onChange={(e) => {
                setMes(Number(e.target.value));
                setPage(0);
              }}
            >
              {MESES.map((nomeMes, idx) => (
                <option key={nomeMes} value={idx + 1}>
                  {nomeMes}
                </option>
              ))}
            </select>
          </div>
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-ano">Ano</label>
            <select
              id="filtro-ano"
              className={listagemStyles.barSelect}
              value={ano}
              onChange={(e) => {
                setAno(Number(e.target.value));
                setPage(0);
              }}
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-local">Local</label>
            <select
              id="filtro-local"
              className={listagemStyles.barSelect}
              value={localCodigo}
              onChange={(e) => {
                setLocalCodigo(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              {locais.map((l) => (
                <option key={l.codigo} value={l.codigo}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-status">Status</label>
            <select
              id="filtro-status"
              className={listagemStyles.barSelect}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | CelebracaoStatus);
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              {STATUS_OPCOES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <PermissionGate permission="celebracao.criar">
            <button type="button" className={listagemStyles.btnCadastrar} onClick={abrirCadastro}>
              Cadastrar
            </button>
          </PermissionGate>
        </ListagemBar>

        <div className={styles.legenda} aria-label="Legenda de destaque">
          <span className={styles.legendaItem}>
            <span className={styles.legendaPonto} style={{ background: '#2563eb' }} /> Futura
          </span>
          <span className={styles.legendaItem}>
            <span className={styles.legendaPonto} style={{ background: 'var(--accent)' }} /> Realizada
          </span>
          <span className={styles.legendaItem}>
            <span className={styles.legendaPonto} style={{ background: '#b91c1c' }} /> Cancelada
          </span>
        </div>

        {loading && <LoadingSpinner label="Carregando celebrações..." />}

        {!loading && (
          <ListagemPanel>
            {lista.length === 0 ? (
              <p className="emptyState">Nenhuma celebração encontrada para os filtros selecionados.</p>
            ) : (
              <div className={styles.agenda}>
                {lista.map((c) => {
                  const d = classificar(c);
                  return (
                    <article key={c.codigo} className={cardClass(d)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <h3 className={styles.titulo}>{c.titulo}</h3>
                        <span className={badgeClass(d)}>{d === 'futura' ? 'Futura' : labelDestaque(d)}</span>
                      </div>
                      <p className={styles.meta}>
                        {formatarData(c.data)} · {horaInput(c.horaInicio)}
                        {c.horaFim ? ` – ${horaInput(c.horaFim)}` : ''}
                      </p>
                      <p className={styles.meta}>{c.localNome || '—'}</p>
                      <p className={styles.meta}>Status: {labelStatus(c.status)}</p>
                      <div className={styles.acoes}>
                        <PermissionGate permission="celebracao.visualizar">
                          <button
                            type="button"
                            className={listagemStyles.btnAcaoExtra}
                            onClick={() => void carregar(c, 'visualizar')}
                          >
                            <Eye size={14} />
                            Visualizar
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="celebracao.editar">
                          <button
                            type="button"
                            className={listagemStyles.btnEditar}
                            onClick={() => void carregar(c, 'editar')}
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="celebracao.excluir">
                          <button type="button" className={listagemStyles.btnExcluir} onClick={() => setExcluirAlvo(c)}>
                            Excluir
                          </button>
                        </PermissionGate>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="celebrações"
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
              <LoadingSpinner label="Carregando celebração..." />
            ) : somenteLeitura ? (
              <div className={musicoStyles.detailGrid}>
                <div className={musicoStyles.detailItem}>
                  <dt>Título</dt>
                  <dd>{form.titulo || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Local</dt>
                  <dd>{locaisDoForm.find((l) => l.codigo === form.localCodigo)?.nome || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Data</dt>
                  <dd>{form.data ? formatarData(form.data) : '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Horário</dt>
                  <dd>
                    {form.horaInicio || '—'}
                    {form.horaFim ? ` – ${form.horaFim}` : ''}
                  </dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Status</dt>
                  <dd>{form.status ? labelStatus(form.status) : '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Descrição</dt>
                  <dd>{form.descricao || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Observação</dt>
                  <dd>{form.observacao || '—'}</dd>
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
                  <label htmlFor="celebracao-titulo">Título</label>
                  <input
                    id="celebracao-titulo"
                    list="titulos-sugeridos"
                    value={form.titulo}
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                    required
                  />
                  <datalist id="titulos-sugeridos">
                    {TITULOS_SUGERIDOS.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <div className="modalFormRow">
                  <label htmlFor="celebracao-local">Local</label>
                  <select
                    id="celebracao-local"
                    className={musicoStyles.select}
                    value={form.localCodigo}
                    onChange={(e) => setForm((f) => ({ ...f, localCodigo: e.target.value }))}
                    required
                  >
                    <option value="">Selecione</option>
                    {locaisDoForm.map((l) => (
                      <option key={l.codigo} value={l.codigo}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modalFormRow">
                  <label htmlFor="celebracao-data">Data</label>
                  <input
                    id="celebracao-data"
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                    required
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="celebracao-inicio">Início</label>
                  <input
                    id="celebracao-inicio"
                    type="time"
                    value={form.horaInicio}
                    onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))}
                    required
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="celebracao-fim">Término</label>
                  <input
                    id="celebracao-fim"
                    type="time"
                    value={form.horaFim ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, horaFim: e.target.value }))}
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="celebracao-status">Status</label>
                  <select
                    id="celebracao-status"
                    className={musicoStyles.select}
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CelebracaoStatus }))}
                  >
                    {STATUS_OPCOES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modalFormRow">
                  <label htmlFor="celebracao-descricao">Descrição</label>
                  <textarea
                    id="celebracao-descricao"
                    className={musicoStyles.textarea}
                    value={form.descricao ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  />
                </div>
                <div className="modalFormRow">
                  <label htmlFor="celebracao-observacao">Observação</label>
                  <textarea
                    id="celebracao-observacao"
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
        title="Excluir celebração"
        message="Celebrações já realizadas não podem ser excluídas. Confirma a exclusão desta celebração?"
        confirmLabel="Excluir"
        confirmLoading={excluindo}
        variant="danger"
        onConfirm={() => {
          if (!excluirAlvo) return;
          setExcluindo(true);
          celebracoesService
            .excluir(excluirAlvo.codigo)
            .then(() => {
              notifySuccess(AppMessages.celebracao.excluido);
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
