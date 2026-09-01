'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifyError, notifySuccess } from '@/lib/notify';
import { podeListarMusicas } from '@/lib/permissions';
import { musicasService } from '@/services/musicas';
import type { CategoriaLiturgica, Musica, MusicaInput } from '@/types/api';
import {
  ListagemTitulo,
  ListagemBar,
  ListagemPanel,
  ListagemPageWrapper,
  ListagemPagination,
  ListagemSwitch,
} from '@/components/listagem';
import { StatusAtivoChip } from '@/components/StatusAtivoChip';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import listagemStyles from '@/components/listagem/listagem.module.css';
import musicoStyles from '@/app/musicos/musicos.module.css';
import styles from './musicas.module.css';

const DEFAULT_PAGE_SIZE = 5;
const CATEGORIAS_FALLBACK: CategoriaLiturgica[] = [
  { codigo: 'ENTRADA', rotulo: 'Entrada' },
  { codigo: 'ATO_PENITENCIAL', rotulo: 'Ato penitencial' },
  { codigo: 'GLORIA', rotulo: 'Glória' },
  { codigo: 'SALMO', rotulo: 'Salmo' },
  { codigo: 'ACLAMACAO', rotulo: 'Aclamação' },
  { codigo: 'OFERTORIO', rotulo: 'Ofertório' },
  { codigo: 'SANTO', rotulo: 'Santo' },
  { codigo: 'CORDEIRO', rotulo: 'Cordeiro' },
  { codigo: 'COMUNHAO', rotulo: 'Comunhão' },
  { codigo: 'POS_COMUNHAO', rotulo: 'Pós-comunhão' },
  { codigo: 'FINAL', rotulo: 'Final' },
  { codigo: 'OUTRO', rotulo: 'Outro' },
];

const FORM_INICIAL: MusicaInput = {
  titulo: '',
  autor: '',
  interpreteReferencia: '',
  tomPadrao: '',
  categoriaLiturgica: '',
  letra: '',
  cifra: '',
  linkReferencia: '',
  observacao: '',
  ativo: true,
};

type ModalMode = 'criar' | 'editar' | 'visualizar';

export default function MusicasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarMusicas(user);

  const [lista, setLista] = useState<Musica[]>([]);
  const [categorias, setCategorias] = useState<CategoriaLiturgica[]>(CATEGORIAS_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [tituloDebounced, setTituloDebounced] = useState('');
  const [autor, setAutor] = useState('');
  const [autorDebounced, setAutorDebounced] = useState('');
  const [categoria, setCategoria] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('criar');
  const [editCodigo, setEditCodigo] = useState<string | null>(null);
  const [form, setForm] = useState<MusicaInput>(FORM_INICIAL);
  const [detalhe, setDetalhe] = useState<Musica | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [atualizandoAtivo, setAtualizandoAtivo] = useState<string | null>(null);
  const [excluirAlvo, setExcluirAlvo] = useState<Musica | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTituloDebounced(titulo);
      setAutorDebounced(autor);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [titulo, autor]);

  useEffect(() => {
    musicasService
      .categorias()
      .then((res) => {
        if (res.data?.length) setCategorias(res.data);
      })
      .catch(() => setCategorias(CATEGORIAS_FALLBACK));
  }, []);

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    musicasService
      .listar({
        titulo: tituloDebounced,
        autor: autorDebounced,
        categoria: categoria || undefined,
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
        notifyApiError(err, { toastId: 'musicas-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, tituloDebounced, autorDebounced, categoria, filtroAtivo, page, pageSize]);

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
    setDetalhe(null);
    setModalOpen(true);
  };

  const carregar = async (item: Musica, mode: ModalMode) => {
    setModalMode(mode);
    setEditCodigo(item.codigo);
    setModalOpen(true);
    setFormLoading(true);
    try {
      const res = await musicasService.buscar(item.codigo);
      const m = res.data;
      setDetalhe(m);
      setForm({
        titulo: m.titulo ?? '',
        autor: m.autor ?? '',
        interpreteReferencia: m.interpreteReferencia ?? '',
        tomPadrao: m.tomPadrao ?? '',
        categoriaLiturgica: m.categoriaLiturgica ?? '',
        letra: m.letra ?? '',
        cifra: m.cifra ?? '',
        linkReferencia: m.linkReferencia ?? '',
        observacao: m.observacao ?? '',
        ativo: m.ativo ?? true,
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
    setDetalhe(null);
  };

  const alterarAtivo = async (item: Musica, ativo: boolean) => {
    setAtualizandoAtivo(item.codigo);
    try {
      await musicasService.atualizarAtivo(item.codigo, ativo);
      notifySuccess(AppMessages.musica.ativoAtualizado(ativo));
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setAtualizandoAtivo(null);
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'visualizar') return;
    if (!form.titulo.trim()) {
      notifyError(AppMessages.validacao.campoObrigatorio('o título'));
      return;
    }
    if (form.linkReferencia?.trim()) {
      const link = form.linkReferencia.trim().toLowerCase();
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        notifyError('O link de referência deve começar com http:// ou https://.');
        return;
      }
    }
    setSalvando(true);
    try {
      const body: MusicaInput = {
        titulo: form.titulo.trim(),
        autor: form.autor?.trim() || null,
        interpreteReferencia: form.interpreteReferencia?.trim() || null,
        tomPadrao: form.tomPadrao?.trim() || null,
        categoriaLiturgica: form.categoriaLiturgica || null,
        letra: form.letra?.trim() || null,
        cifra: form.cifra?.trim() || null,
        linkReferencia: form.linkReferencia?.trim() || null,
        observacao: form.observacao?.trim() || null,
        ativo: form.ativo ?? true,
      };
      if (modalMode === 'editar' && editCodigo) {
        await musicasService.atualizar(editCodigo, body);
      } else {
        await musicasService.criar(body);
      }
      notifySuccess(AppMessages.musica.salvo(modalMode === 'editar'));
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  const rotuloCategoria = (item: Musica) =>
    item.categoriaLiturgicaRotulo || categorias.find((c) => c.codigo === item.categoriaLiturgica)?.rotulo || item.categoriaLiturgica || '—';

  const categoriasDoForm = form.categoriaLiturgica && !categorias.some((c) => c.codigo === form.categoriaLiturgica)
    ? [{ codigo: form.categoriaLiturgica, rotulo: form.categoriaLiturgica }, ...categorias]
    : categorias;

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Músicas" />
        <p className="emptyState">Você não tem permissão para listar músicas.</p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  const somenteLeitura = modalMode === 'visualizar';
  const tituloModal =
    modalMode === 'visualizar' ? 'Visualizar música' : modalMode === 'editar' ? 'Editar música' : 'Cadastrar música';

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Músicas" />
        <ListagemBar
          searchPlaceholder="Busque por título"
          searchValue={titulo}
          onSearchChange={setTitulo}
          onLimparFiltros={() => {
            setTitulo('');
            setAutor('');
            setCategoria('');
            setFiltroAtivo('');
            setPage(0);
          }}
        >
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-autor">Autor</label>
            <input
              id="filtro-autor"
              className={styles.filtroTexto}
              data-search-input
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Autor"
            />
          </div>
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-categoria">Categoria</label>
            <select
              id="filtro-categoria"
              className={listagemStyles.barSelect}
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  {c.rotulo}
                </option>
              ))}
            </select>
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
              <option value="true">Ativas</option>
              <option value="false">Inativas</option>
            </select>
          </div>
          <PermissionGate permission="musica.criar">
            <button type="button" className={listagemStyles.btnCadastrar} onClick={abrirCadastro}>
              Cadastrar
            </button>
          </PermissionGate>
        </ListagemBar>

        {loading && <LoadingSpinner label="Carregando músicas..." />}

        {!loading && (
          <ListagemPanel>
            {lista.length === 0 ? (
              <p className="emptyState">Nenhuma música encontrada para os filtros selecionados.</p>
            ) : (
              <div className={styles.catalogo}>
                {lista.map((m) => (
                  <article key={m.codigo} className={`${styles.card} ${m.ativo === false ? styles.cardInativa : ''}`}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.titulo}>{m.titulo}</h3>
                      <PermissionGate permission="musica.editar" fallback={<StatusAtivoChip ativo={Boolean(m.ativo)} />}>
                        <ListagemSwitch
                          checked={Boolean(m.ativo)}
                          disabled={atualizandoAtivo === m.codigo}
                          aria-label={m.ativo ? 'Inativar música' : 'Ativar música'}
                          onChange={(checked) => void alterarAtivo(m, checked)}
                        />
                      </PermissionGate>
                    </div>
                    <p className={styles.autor}>{m.autor || 'Autor não informado'}</p>
                    <div className={styles.metaRow}>
                      <span className={styles.chip}>{rotuloCategoria(m)}</span>
                      {m.tomPadrao ? <span className={`${styles.chip} ${styles.chipTom}`}>Tom {m.tomPadrao}</span> : null}
                    </div>
                    <div className={styles.acoes}>
                      <PermissionGate permission="musica.visualizar">
                        <button
                          type="button"
                          className={listagemStyles.btnAcaoExtra}
                          onClick={() => void carregar(m, 'visualizar')}
                        >
                          <Eye size={14} />
                          Visualizar
                        </button>
                      </PermissionGate>
                      <PermissionGate permission="musica.editar">
                        <button
                          type="button"
                          className={listagemStyles.btnEditar}
                          onClick={() => void carregar(m, 'editar')}
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                      </PermissionGate>
                      <PermissionGate permission="musica.excluir">
                        <button type="button" className={listagemStyles.btnExcluir} onClick={() => setExcluirAlvo(m)}>
                          Excluir
                        </button>
                      </PermissionGate>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="músicas"
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
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <ModalCloseButton onClose={fecharModal} disabled={salvando} />
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 600, paddingRight: '2.5rem' }}>
              {tituloModal}
            </h2>
            {formLoading ? (
              <LoadingSpinner label="Carregando música..." />
            ) : somenteLeitura ? (
              <div className={musicoStyles.detailGrid}>
                <div className={musicoStyles.detailItem}>
                  <dt>Título</dt>
                  <dd>{detalhe?.titulo || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Autor</dt>
                  <dd>{detalhe?.autor || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Intérprete de referência</dt>
                  <dd>{detalhe?.interpreteReferencia || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Categoria</dt>
                  <dd>{detalhe ? rotuloCategoria(detalhe) : '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Tom</dt>
                  <dd>{detalhe?.tomPadrao || '—'}</dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Referência</dt>
                  <dd>
                    {detalhe?.linkReferencia ? (
                      <a href={detalhe.linkReferencia} target="_blank" rel="noreferrer">
                        {detalhe.linkReferencia}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Letra</dt>
                  <dd>
                    {detalhe?.letra ? <pre className={styles.blocoTexto}>{detalhe.letra}</pre> : '—'}
                  </dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Cifra</dt>
                  <dd>
                    {detalhe?.cifra ? (
                      <pre className={`${styles.blocoTexto} ${styles.blocoCifra}`}>{detalhe.cifra}</pre>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Observações</dt>
                  <dd>{detalhe?.observacao || '—'}</dd>
                </div>
                <p className={styles.anexoHint}>Anexos de cifra e áudio (MinIO) serão habilitados em uma próxima etapa.</p>
                <div className="modalActions">
                  <button type="button" className="modalBtnSecondary" onClick={fecharModal}>
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void salvar(e)}>
                <div className={musicoStyles.detailGrid}>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-titulo">Título</label>
                    </dt>
                    <dd>
                      <input
                        id="musica-titulo"
                        className={styles.textarea}
                        style={{ minHeight: 'unset' }}
                        value={form.titulo}
                        onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                        required
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-autor">Autor</label>
                    </dt>
                    <dd>
                      <input
                        id="musica-autor"
                        className={styles.textarea}
                        style={{ minHeight: 'unset' }}
                        value={form.autor ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))}
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-interprete">Intérprete de referência</label>
                    </dt>
                    <dd>
                      <input
                        id="musica-interprete"
                        className={styles.textarea}
                        style={{ minHeight: 'unset' }}
                        value={form.interpreteReferencia ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, interpreteReferencia: e.target.value }))}
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-categoria">Categoria litúrgica</label>
                    </dt>
                    <dd>
                      <select
                        id="musica-categoria"
                        className={listagemStyles.barSelect}
                        style={{ width: '100%' }}
                        value={form.categoriaLiturgica ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, categoriaLiturgica: e.target.value }))}
                      >
                        <option value="">Não informada</option>
                        {categoriasDoForm.map((c) => (
                          <option key={c.codigo} value={c.codigo}>
                            {c.rotulo}
                          </option>
                        ))}
                      </select>
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-tom">Tom padrão</label>
                    </dt>
                    <dd>
                      <input
                        id="musica-tom"
                        className={styles.textarea}
                        style={{ minHeight: 'unset' }}
                        data-no-uppercase
                        placeholder="Ex.: G, Am, D"
                        value={form.tomPadrao ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, tomPadrao: e.target.value }))}
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-link">Link de referência</label>
                    </dt>
                    <dd>
                      <input
                        id="musica-link"
                        className={styles.textarea}
                        style={{ minHeight: 'unset' }}
                        data-no-uppercase
                        placeholder="https://"
                        value={form.linkReferencia ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, linkReferencia: e.target.value }))}
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-letra">Letra</label>
                    </dt>
                    <dd>
                      <textarea
                        id="musica-letra"
                        className={styles.textarea}
                        data-no-uppercase
                        value={form.letra ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, letra: e.target.value }))}
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-cifra">Cifra</label>
                    </dt>
                    <dd>
                      <textarea
                        id="musica-cifra"
                        className={`${styles.textarea} ${styles.textareaMono}`}
                        data-no-uppercase
                        value={form.cifra ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, cifra: e.target.value }))}
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-obs">Observação</label>
                    </dt>
                    <dd>
                      <textarea
                        id="musica-obs"
                        className={styles.textarea}
                        data-no-uppercase
                        value={form.observacao ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                      />
                    </dd>
                  </div>
                </div>
                <p className={styles.anexoHint}>
                  Anexos (PDF de cifra, áudio) serão armazenados no MinIO em etapa posterior.
                </p>
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
        title="Excluir música"
        message={`Excluir a música "${excluirAlvo?.titulo ?? ''}"? Ela será apagada do catálogo e retirada dos repertórios. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        confirmLoading={excluindo}
        onCancel={() => setExcluirAlvo(null)}
        onConfirm={() => {
          if (!excluirAlvo) return;
          setExcluindo(true);
          musicasService
            .excluir(excluirAlvo.codigo)
            .then(() => {
              notifySuccess(AppMessages.musica.excluido);
              setExcluirAlvo(null);
              loadData();
            })
            .catch((err) => notifyApiError(err))
            .finally(() => setExcluindo(false));
        }}
      />
    </>
  );
}
