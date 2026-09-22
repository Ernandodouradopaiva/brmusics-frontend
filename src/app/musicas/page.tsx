'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Eye, Pencil } from 'lucide-react';
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
  ListagemSwitch,
} from '@/components/listagem';
import { StatusAtivoChip } from '@/components/StatusAtivoChip';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import listagemStyles from '@/components/listagem/listagem.module.css';
import musicoStyles from '@/app/musicos/musicos.module.css';
import styles from './musicas.module.css';

const LISTAGEM_SIZE = 1000;
const CATEGORIA_SEM = '__SEM_CATEGORIA__';
const CATEGORIAS_FALLBACK: CategoriaLiturgica[] = [
  { codigo: 'ENTRADA', rotulo: 'Entrada' },
  { codigo: 'ATO_PENITENCIAL', rotulo: 'Ato Penitencial' },
  { codigo: 'GLORIA', rotulo: 'Glória' },
  { codigo: 'SALMO', rotulo: 'Salmo Responsorial' },
  { codigo: 'ACLAMACAO', rotulo: 'Aclamação ao Evangelho' },
  { codigo: 'PRECES', rotulo: 'Preces' },
  { codigo: 'OFERTORIO', rotulo: 'Apresentação das Oferendas' },
  { codigo: 'SANTO', rotulo: 'Santo' },
  { codigo: 'ORACAO_EUCAISTICA', rotulo: 'Oração Eucarística' },
  { codigo: 'ELEVACAO', rotulo: 'Elevação' },
  { codigo: 'AMEM', rotulo: 'Amém' },
  { codigo: 'CORDEIRO', rotulo: 'Cordeiro de Deus' },
  { codigo: 'COMUNHAO', rotulo: 'Comunhão' },
  { codigo: 'POS_COMUNHAO', rotulo: 'Pós-Comunhão / Ação de Graças' },
  { codigo: 'FINAL', rotulo: 'Final' },
  { codigo: 'ADORACAO', rotulo: 'Adoração' },
  { codigo: 'MARIANA', rotulo: 'Mariana' },
  { codigo: 'ESPIRITO_SANTO', rotulo: 'Espírito Santo' },
  { codigo: 'LOUVOR', rotulo: 'Louvor' },
  { codigo: 'OUTROS', rotulo: 'Outros' },
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

function ehLinkHttp(valor?: string | null): boolean {
  if (!valor) return false;
  const lower = valor.trim().toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
}

function validarLinkOpcional(valor: string | null | undefined, mensagem: string): boolean {
  if (!valor?.trim()) return true;
  if (ehLinkHttp(valor)) return true;
  notifyError(mensagem);
  return false;
}

function LinkCampo({ valor }: { valor?: string | null }) {
  if (!valor) {
    return <span>—</span>;
  }
  if (ehLinkHttp(valor)) {
    return (
      <a href={valor} target="_blank" rel="noreferrer">
        {valor}
      </a>
    );
  }
  return <pre className={styles.blocoTexto}>{valor}</pre>;
}

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
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());
  const [exportandoCsv, setExportandoCsv] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTituloDebounced(titulo);
      setAutorDebounced(autor);
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
        page: 0,
        size: LISTAGEM_SIZE,
        sort: 'titulo',
      })
      .then((res) => {
        setLista(res.data.content ?? []);
        setTotalElements(res.data.totalElements ?? 0);
      })
      .catch((err) => {
        setLista([]);
        setTotalElements(0);
        notifyApiError(err, { toastId: 'musicas-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, tituloDebounced, autorDebounced, categoria, filtroAtivo]);

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      setLista([]);
      return;
    }
    loadData();
  }, [authLoading, podeListar, loadData]);

  const grupos = useMemo(() => {
    const porCodigo = new Map<string, Musica[]>();
    for (const musica of lista) {
      const codigo = musica.categoriaLiturgica || CATEGORIA_SEM;
      const atuais = porCodigo.get(codigo) ?? [];
      atuais.push(musica);
      porCodigo.set(codigo, atuais);
    }

    const ordenados: { codigo: string; rotulo: string; itens: Musica[] }[] = [];
    const vistos = new Set<string>();

    for (const cat of categorias) {
      if (categoria && cat.codigo !== categoria) continue;
      const itens = porCodigo.get(cat.codigo);
      if (!itens?.length) continue;
      ordenados.push({ codigo: cat.codigo, rotulo: cat.rotulo, itens });
      vistos.add(cat.codigo);
    }

    for (const [codigo, itens] of porCodigo) {
      if (vistos.has(codigo) || codigo === CATEGORIA_SEM) continue;
      if (categoria && codigo !== categoria) continue;
      ordenados.push({
        codigo,
        rotulo: itens[0]?.categoriaLiturgicaRotulo || codigo.replace(/_/g, ' '),
        itens,
      });
    }

    if (!categoria) {
      const semCategoria = porCodigo.get(CATEGORIA_SEM);
      if (semCategoria?.length) {
        ordenados.push({ codigo: CATEGORIA_SEM, rotulo: 'Sem categoria', itens: semCategoria });
      }
    }

    return ordenados;
  }, [lista, categorias, categoria]);

  const chaveGrupos = useMemo(() => grupos.map((g) => g.codigo).join('|'), [grupos]);

  useEffect(() => {
    if (!chaveGrupos) {
      setRecolhidos(new Set());
      return;
    }
    // Por padrão, categorias começam recolhidas para facilitar a navegação.
    setRecolhidos(new Set(chaveGrupos.split('|')));
  }, [chaveGrupos]);

  const alternarGrupo = (codigo: string) => {
    setRecolhidos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(codigo)) {
        proximo.delete(codigo);
      } else {
        proximo.add(codigo);
      }
      return proximo;
    });
  };

  const expandirTodas = () => setRecolhidos(new Set());
  const recolherTodas = () => setRecolhidos(new Set(grupos.map((g) => g.codigo)));

  const abrirCadastro = () => {
    setModalMode('criar');
    setEditCodigo(null);
    setForm(FORM_INICIAL);
    setDetalhe(null);
    setModalOpen(true);
  };

  const exportarCsv = async () => {
    if (exportandoCsv) return;
    setExportandoCsv(true);
    try {
      const blob = await musicasService.exportarCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'musicas.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notifySuccess(AppMessages.musica.csvExportado);
    } catch (err) {
      notifyApiError(err, { toastId: 'musicas-erro-csv' });
    } finally {
      setExportandoCsv(false);
    }
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
    if (!validarLinkOpcional(form.linkReferencia, 'O link de referência deve começar com http:// ou https://.')) {
      return;
    }
    if (!validarLinkOpcional(form.letra, 'O link da letra deve começar com http:// ou https://.')) {
      return;
    }
    if (!validarLinkOpcional(form.cifra, 'O link da cifra deve começar com http:// ou https://.')) {
      return;
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
              onChange={(e) => setCategoria(e.target.value)}
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
              onChange={(e) => setFiltroAtivo(e.target.value as '' | 'true' | 'false')}
            >
              <option value="">Todas</option>
              <option value="true">Ativas</option>
              <option value="false">Inativas</option>
            </select>
          </div>
          <PermissionGate permission="musica.listar">
            <button
              type="button"
              className={listagemStyles.btnLimpar}
              onClick={exportarCsv}
              disabled={exportandoCsv}
            >
              {exportandoCsv ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </PermissionGate>
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
              <>
                <div className={styles.resumoBar}>
                  <p className={styles.resumoLista}>
                    {totalElements === 1
                      ? '1 música'
                      : `${Math.min(lista.length, totalElements)} músicas`}
                    {totalElements > lista.length
                      ? ` (exibindo as primeiras ${lista.length} de ${totalElements})`
                      : ''}
                    {' · '}
                    {grupos.length === 1 ? '1 categoria' : `${grupos.length} categorias`}
                  </p>
                  <div className={styles.resumoAcoes}>
                    <button type="button" className={styles.btnResumo} onClick={expandirTodas}>
                      Expandir todas
                    </button>
                    <button type="button" className={styles.btnResumo} onClick={recolherTodas}>
                      Recolher todas
                    </button>
                  </div>
                </div>
                <div className={styles.grupos}>
                  {grupos.map((grupo) => {
                    const recolhido = recolhidos.has(grupo.codigo);
                    return (
                      <section key={grupo.codigo} className={styles.grupo}>
                        <button
                          type="button"
                          className={styles.grupoHeader}
                          onClick={() => alternarGrupo(grupo.codigo)}
                          aria-expanded={!recolhido}
                          aria-controls={`grupo-musicas-${grupo.codigo}`}
                        >
                          <span className={styles.grupoTituloWrap}>
                            {recolhido ? <ChevronRight size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
                            <h2 className={styles.grupoTitulo}>{grupo.rotulo}</h2>
                          </span>
                          <span className={styles.grupoContagem}>
                            {grupo.itens.length === 1 ? '1 música' : `${grupo.itens.length} músicas`}
                          </span>
                        </button>
                        {!recolhido && (
                          <div id={`grupo-musicas-${grupo.codigo}`} className={styles.catalogo}>
                            {grupo.itens.map((m) => (
                              <article
                                key={m.codigo}
                                className={`${styles.card} ${m.ativo === false ? styles.cardInativa : ''}`}
                              >
                                <div className={styles.cardHeader}>
                                  <h3 className={styles.titulo}>{m.titulo}</h3>
                                  <PermissionGate
                                    permission="musica.editar"
                                    fallback={<StatusAtivoChip ativo={Boolean(m.ativo)} />}
                                  >
                                    <ListagemSwitch
                                      checked={Boolean(m.ativo)}
                                      disabled={atualizandoAtivo === m.codigo}
                                      aria-label={m.ativo ? 'Inativar música' : 'Ativar música'}
                                      onChange={(checked) => void alterarAtivo(m, checked)}
                                    />
                                  </PermissionGate>
                                </div>
                                <p className={styles.autor}>{m.autor || 'Autor não informado'}</p>
                                {m.tomPadrao ? (
                                  <div className={styles.metaRow}>
                                    <span className={`${styles.chip} ${styles.chipTom}`}>Tom {m.tomPadrao}</span>
                                  </div>
                                ) : null}
                                <div className={styles.acoes}>
                                  {ehLinkHttp(m.letra) && (
                                    <a
                                      className={styles.btnLink}
                                      href={m.letra!.trim()}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Letra
                                    </a>
                                  )}
                                  {ehLinkHttp(m.cifra) && (
                                    <a
                                      className={styles.btnLink}
                                      href={m.cifra!.trim()}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Cifra
                                    </a>
                                  )}
                                  {ehLinkHttp(m.linkReferencia) && (
                                    <a
                                      className={styles.btnLink}
                                      href={m.linkReferencia!.trim()}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Youtube
                                    </a>
                                  )}
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
                                    <button
                                      type="button"
                                      className={listagemStyles.btnExcluir}
                                      onClick={() => setExcluirAlvo(m)}
                                    >
                                      Excluir
                                    </button>
                                  </PermissionGate>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </>
            )}
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
                  <dt>Link de referência</dt>
                  <dd>
                    <LinkCampo valor={detalhe?.linkReferencia} />
                  </dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Link da letra</dt>
                  <dd>
                    <LinkCampo valor={detalhe?.letra} />
                  </dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Link da cifra</dt>
                  <dd>
                    <LinkCampo valor={detalhe?.cifra} />
                  </dd>
                </div>
                <div className={musicoStyles.detailItem}>
                  <dt>Observações</dt>
                  <dd>{detalhe?.observacao || '—'}</dd>
                </div>
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
                      <label htmlFor="musica-letra">Link da letra</label>
                    </dt>
                    <dd>
                      <input
                        id="musica-letra"
                        className={styles.textarea}
                        style={{ minHeight: 'unset' }}
                        data-no-uppercase
                        placeholder="https://"
                        value={form.letra ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, letra: e.target.value }))}
                      />
                    </dd>
                  </div>
                  <div className={musicoStyles.detailItem}>
                    <dt>
                      <label htmlFor="musica-cifra">Link da cifra</label>
                    </dt>
                    <dd>
                      <input
                        id="musica-cifra"
                        className={styles.textarea}
                        style={{ minHeight: 'unset' }}
                        data-no-uppercase
                        placeholder="https://"
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
                  Letra, cifra e referência devem ser URLs começando com http:// ou https://.
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
