'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifyError, notifySuccess } from '@/lib/notify';
import { hasPermission, podeListarRepertorios } from '@/lib/permissions';
import { repertoriosService } from '@/services/repertorios';
import { musicasService } from '@/services/musicas';
import type { CategoriaLiturgica, Musica, RepertorioMensalItem } from '@/types/api';
import { ListagemTitulo, ListagemPageWrapper } from '@/components/listagem';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import listagemStyles from '@/components/listagem/listagem.module.css';
import styles from './repertorios.module.css';

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
const MESES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const MOMENTOS_PROMPT = [
  'ENTRADA',
  'ATO_PENITENCIAL',
  'GLORIA',
  'ACLAMACAO',
  'OFERTORIO',
  'SANTO',
  'COMUNHAO',
  'FINAL',
] as const;

const MOMENTOS_FALLBACK: CategoriaLiturgica[] = [
  { codigo: 'ENTRADA', rotulo: 'Entrada' },
  { codigo: 'ATO_PENITENCIAL', rotulo: 'Ato Penitencial' },
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

type LinhaRepertorio = {
  id: string;
  codigo?: string;
  musicaCodigo: string;
  musicaTitulo: string;
  musicaAutor?: string;
  tomPadraoMusica?: string;
  momentoLiturgico: string;
  ordem: number;
  tom: string;
  observacao: string;
};

function horaInput(valor?: string | null): string {
  if (!valor) return '';
  return String(valor).slice(0, 5);
}

function diaDoIso(iso: string): string {
  const partes = iso.split('-');
  return partes[2] ?? iso;
}

function mesCurto(iso: string): string {
  const mes = Number(iso.split('-')[1]);
  return MESES_CURTO[mes - 1] ?? '';
}

function novaId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function rotuloFallback(codigo: string): string {
  return MOMENTOS_FALLBACK.find((m) => m.codigo === codigo)?.rotulo ?? codigo.replace(/_/g, ' ');
}

function momentosDaTela(catalogo: CategoriaLiturgica[], linhas: LinhaRepertorio[]): CategoriaLiturgica[] {
  const porCodigo = new Map(catalogo.map((item) => [item.codigo, item]));
  const vistos = new Set<string>();
  const resultado: CategoriaLiturgica[] = [];
  for (const codigo of MOMENTOS_PROMPT) {
    resultado.push(porCodigo.get(codigo) ?? { codigo, rotulo: rotuloFallback(codigo) });
    vistos.add(codigo);
  }
  for (const cat of catalogo) {
    if (!vistos.has(cat.codigo)) {
      resultado.push(cat);
      vistos.add(cat.codigo);
    }
  }
  for (const linha of linhas) {
    if (!vistos.has(linha.momentoLiturgico)) {
      resultado.push({
        codigo: linha.momentoLiturgico,
        rotulo: rotuloFallback(linha.momentoLiturgico),
      });
      vistos.add(linha.momentoLiturgico);
    }
  }
  return resultado;
}

export default function RepertoriosPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Carregando repertórios..." />}>
      <RepertoriosPageInner />
    </Suspense>
  );
}

function RepertoriosPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarRepertorios(user);
  const hoje = useMemo(() => new Date(), []);
  const abertoViaQuery = useRef(false);

  const mesParam = Number(searchParams.get('mes'));
  const anoParam = Number(searchParams.get('ano'));
  const celebracaoParam = searchParams.get('celebracao');

  const [mes, setMes] = useState(mesParam >= 1 && mesParam <= 12 ? mesParam : hoje.getMonth() + 1);
  const [ano, setAno] = useState(anoParam > 1900 ? anoParam : hoje.getFullYear());
  const [itens, setItens] = useState<RepertorioMensalItem[]>([]);
  const [momentos, setMomentos] = useState<CategoriaLiturgica[]>(MOMENTOS_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [somenteLeitura, setSomenteLeitura] = useState(false);
  const [itemAtual, setItemAtual] = useState<RepertorioMensalItem | null>(null);
  const [linhas, setLinhas] = useState<LinhaRepertorio[]>([]);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [excluirAlvo, setExcluirAlvo] = useState<RepertorioMensalItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [buscaMomento, setBuscaMomento] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [termoDebounced, setTermoDebounced] = useState('');
  const [resultados, setResultados] = useState<Musica[]>([]);
  const [buscando, setBuscando] = useState(false);

  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anoAnterior = mes === 1 ? ano - 1 : ano;
  const mesSeguinte = mes === 12 ? 1 : mes + 1;
  const anoSeguinte = mes === 12 ? ano + 1 : ano;

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    repertoriosService
      .listarMensal(ano, mes)
      .then((res) => setItens(res.data ?? []))
      .catch((err) => {
        setItens([]);
        notifyApiError(err, { toastId: 'repertorios-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, ano, mes]);

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      setItens([]);
      return;
    }
    loadData();
  }, [authLoading, podeListar, loadData]);

  useEffect(() => {
    repertoriosService
      .momentos()
      .then((res) => {
        if (res.data?.length) setMomentos(res.data);
      })
      .catch(() => undefined);
  }, []);

  const abrirEditor = useCallback((item: RepertorioMensalItem, leitura: boolean) => {
    const publicada = item.repertorioStatus === 'PUBLICADA';
    setItemAtual(item);
    setSomenteLeitura(leitura || publicada);
    setObservacao(item.observacao ?? '');
    setLinhas(
      (item.itens ?? []).map((p, indice) => ({
        id: p.codigo || `${p.musicaCodigo}-${indice}`,
        codigo: p.codigo,
        musicaCodigo: p.musicaCodigo,
        musicaTitulo: p.musicaTitulo,
        musicaAutor: p.musicaAutor ?? undefined,
        tomPadraoMusica: p.tomPadraoMusica ?? undefined,
        momentoLiturgico: p.momentoLiturgico,
        ordem: p.ordem ?? indice,
        tom: p.tom ?? p.tomPadraoMusica ?? '',
        observacao: p.observacao ?? '',
      }))
    );
    setBuscaMomento(null);
    setTermoBusca('');
    setResultados([]);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (!celebracaoParam || loading || abertoViaQuery.current) return;
    const item = itens.find((i) => i.celebracaoCodigo === celebracaoParam);
    if (!item) return;
    abertoViaQuery.current = true;
    const podeMontar =
      hasPermission(user, item.repertorioCodigo ? 'repertorio.editar' : 'repertorio.criar') &&
      item.repertorioStatus !== 'PUBLICADA';
    abrirEditor(item, !podeMontar);
    router.replace('/repertorios');
  }, [celebracaoParam, loading, itens, user, abrirEditor, router]);

  useEffect(() => {
    const handle = window.setTimeout(() => setTermoDebounced(termoBusca.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [termoBusca]);

  useEffect(() => {
    if (!buscaMomento) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    musicasService
      .listar({
        titulo: termoDebounced || undefined,
        page: 0,
        size: 8,
        sort: 'titulo',
        ativo: true,
      })
      .then((res) => setResultados(res.data.content ?? []))
      .catch(() => setResultados([]))
      .finally(() => setBuscando(false));
  }, [buscaMomento, termoDebounced]);

  const fecharModal = () => {
    if (salvando) return;
    setModalOpen(false);
    setItemAtual(null);
    setLinhas([]);
    setObservacao('');
    setBuscaMomento(null);
  };

  const secoes = momentosDaTela(momentos, linhas);

  const linhasDoMomento = (momento: string) =>
    linhas
      .filter((linha) => linha.momentoLiturgico === momento)
      .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id));

  const adicionarMusica = (momento: string, musica: Musica) => {
    setLinhas((atual) => {
      const doMomento = atual.filter((linha) => linha.momentoLiturgico === momento);
      const ordem = doMomento.reduce((max, linha) => Math.max(max, linha.ordem), -1) + 1;
      return [
        ...atual,
        {
          id: novaId(),
          musicaCodigo: musica.codigo,
          musicaTitulo: musica.titulo,
          musicaAutor: musica.autor ?? undefined,
          tomPadraoMusica: musica.tomPadrao ?? undefined,
          momentoLiturgico: momento,
          ordem,
          tom: musica.tomPadrao ?? '',
          observacao: '',
        },
      ];
    });
    setTermoBusca('');
    setBuscaMomento(null);
  };

  const atualizarLinha = (id: string, patch: Partial<LinhaRepertorio>) => {
    setLinhas((atual) => atual.map((linha) => (linha.id === id ? { ...linha, ...patch } : linha)));
  };

  const removerLinha = (id: string) => {
    setLinhas((atual) => atual.filter((linha) => linha.id !== id));
  };

  const moverLinha = (momento: string, id: string, direcao: -1 | 1) => {
    setLinhas((atual) => {
      const doMomento = atual
        .filter((linha) => linha.momentoLiturgico === momento)
        .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id));
      const indice = doMomento.findIndex((linha) => linha.id === id);
      const destino = indice + direcao;
      if (indice < 0 || destino < 0 || destino >= doMomento.length) return atual;
      const copia = [...doMomento];
      const [item] = copia.splice(indice, 1);
      copia.splice(destino, 0, item);
      const novaOrdem = new Map(copia.map((linha, i) => [linha.id, i]));
      return atual.map((linha) =>
        linha.momentoLiturgico === momento ? { ...linha, ordem: novaOrdem.get(linha.id) ?? linha.ordem } : linha
      );
    });
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemAtual || somenteLeitura) return;
    for (const linha of linhas) {
      if (!linha.musicaCodigo) {
        notifyError(AppMessages.validacao.campoObrigatorio('a música de cada item'));
        return;
      }
    }
    setSalvando(true);
    try {
      const body = {
        celebracaoCodigo: itemAtual.celebracaoCodigo,
        observacao: observacao.trim() || null,
        itens: secoes.flatMap((secao) =>
          linhasDoMomento(secao.codigo).map((linha, ordem) => ({
            codigo: linha.codigo || null,
            musicaCodigo: linha.musicaCodigo,
            momentoLiturgico: secao.codigo,
            ordem,
            tom: linha.tom.trim() || null,
            observacao: linha.observacao.trim() || null,
          }))
        ),
      };
      if (itemAtual.repertorioCodigo) {
        await repertoriosService.atualizar(itemAtual.repertorioCodigo, body);
      } else {
        await repertoriosService.criar(body);
      }
      notifySuccess(AppMessages.repertorio.salvo(Boolean(itemAtual.repertorioCodigo)));
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Repertórios" />

        <nav className={styles.navMes} aria-label="Navegação de mês">
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => {
              setMes(mesAnterior);
              setAno(anoAnterior);
            }}
          >
            <ChevronLeft size={16} />
            {MESES[mesAnterior - 1]}
          </button>
          <h2 className={styles.mesAtual}>
            {MESES[mes - 1]} {ano}
          </h2>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => {
              setMes(mesSeguinte);
              setAno(anoSeguinte);
            }}
          >
            {MESES[mesSeguinte - 1]}
            <ChevronRight size={16} />
          </button>
        </nav>

        {loading && <LoadingSpinner label="Carregando repertórios..." />}

        {!loading && itens.length === 0 && (
          <p className="emptyState">
            Nenhuma celebração cadastrada em {MESES[mes - 1].toLowerCase()} de {ano}. Cadastre as missas em
            Celebrações para montar o repertório.
          </p>
        )}

        {!loading && itens.length > 0 && (
          <div className={styles.agenda}>
            {itens.map((item) => {
              const publicada = item.repertorioStatus === 'PUBLICADA';
              const cancelada = item.celebracaoStatus === 'CANCELADA';
              return (
                <article
                  key={item.celebracaoCodigo}
                  className={`${styles.card} ${cancelada ? styles.cardCancelada : ''} ${
                    publicada ? styles.cardPublicada : ''
                  }`}
                >
                  <div className={styles.dataBloco} aria-hidden>
                    <span className={styles.dataDia}>{diaDoIso(item.data)}</span>
                    <span className={styles.dataMes}>{mesCurto(item.data)}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <span className={`${styles.badge} ${publicada ? styles.badgePublicada : styles.badgeRascunho}`}>
                      {publicada ? 'Publicada' : 'Rascunho'}
                    </span>
                    <h3 className={styles.titulo}>{item.titulo}</h3>
                    <p className={styles.meta}>
                      {item.diaSemana || '—'} • {horaInput(item.horaInicio)}
                      {item.horaFim ? ` – ${horaInput(item.horaFim)}` : ''}
                    </p>
                    <p className={styles.meta}>{item.localNome || '—'}</p>
                    <p className={styles.qtd}>
                      {item.quantidadeItens} {item.quantidadeItens === 1 ? 'música' : 'músicas'}
                    </p>
                    {(item.itens ?? []).length > 0 && (
                      <ul className={styles.equipe}>
                        {item.itens.map((p) => (
                          <li key={p.codigo || `${p.momentoLiturgico}-${p.musicaCodigo}-${p.ordem}`}>
                            {p.momentoLiturgicoRotulo || p.momentoLiturgico}: {p.musicaTitulo}
                            {p.tom ? ` (${p.tom})` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.acoes}>
                    <PermissionGate permission={item.repertorioCodigo ? 'repertorio.editar' : 'repertorio.criar'}>
                      {!publicada && (
                        <button
                          type="button"
                          className={listagemStyles.btnCadastrar}
                          onClick={() => abrirEditor(item, false)}
                        >
                          {item.repertorioCodigo ? 'Editar repertório' : 'Montar repertório'}
                        </button>
                      )}
                    </PermissionGate>
                    <PermissionGate permission="repertorio.visualizar">
                      <button
                        type="button"
                        className={listagemStyles.btnAcaoExtra}
                        onClick={() => abrirEditor(item, true)}
                      >
                        Ver
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="repertorio.excluir">
                      {item.repertorioCodigo && !publicada && (item.quantidadeItens ?? 0) > 0 && (
                        <button
                          type="button"
                          className={listagemStyles.btnAcaoExtra}
                          onClick={() => setExcluirAlvo(item)}
                        >
                          Limpar repertório
                        </button>
                      )}
                    </PermissionGate>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </ListagemPageWrapper>

      {modalOpen && itemAtual && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <ModalCloseButton onClose={fecharModal} disabled={salvando} />
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 700, paddingRight: '2.5rem' }}>
              {somenteLeitura ? 'Repertório' : itemAtual.repertorioCodigo ? 'Editar repertório' : 'Montar repertório'}
            </h2>
            <p className={styles.meta}>
              {diaDoIso(itemAtual.data)}/{mesCurto(itemAtual.data)} • {itemAtual.diaSemana} •{' '}
              {horaInput(itemAtual.horaInicio)} — {itemAtual.titulo}
            </p>

            <form onSubmit={(e) => void salvar(e)}>
              <div className={styles.momentos}>
                {secoes.map((secao) => {
                  const doMomento = linhasDoMomento(secao.codigo);
                  return (
                    <section key={secao.codigo} className={styles.secao}>
                      <h3 className={styles.secaoTitulo}>{secao.rotulo}</h3>
                      {doMomento.map((linha, indice) => (
                        <div key={linha.id} className={styles.linha}>
                          <div className={styles.linhaHeader}>
                            <div>
                              <p className={styles.musicaNome}>{linha.musicaTitulo}</p>
                              {linha.musicaAutor ? (
                                <p className={styles.musicaAutor}>{linha.musicaAutor}</p>
                              ) : null}
                            </div>
                            {!somenteLeitura && (
                              <div className={styles.linhaAcoes}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  aria-label="Subir"
                                  disabled={indice === 0}
                                  onClick={() => moverLinha(secao.codigo, linha.id, -1)}
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  aria-label="Descer"
                                  disabled={indice === doMomento.length - 1}
                                  onClick={() => moverLinha(secao.codigo, linha.id, 1)}
                                >
                                  <ChevronDown size={16} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.iconBtn} ${styles.iconBtnPerigo}`}
                                  aria-label="Remover"
                                  onClick={() => removerLinha(linha.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className={styles.camposLinha}>
                            <div className={styles.campo}>
                              <label htmlFor={`tom-${linha.id}`}>Tom</label>
                              <input
                                id={`tom-${linha.id}`}
                                className={styles.input}
                                value={linha.tom}
                                disabled={somenteLeitura}
                                placeholder={linha.tomPadraoMusica || ''}
                                onChange={(e) => atualizarLinha(linha.id, { tom: e.target.value })}
                              />
                            </div>
                            <div className={styles.campo}>
                              <label htmlFor={`obs-${linha.id}`}>Observação</label>
                              <input
                                id={`obs-${linha.id}`}
                                className={styles.input}
                                value={linha.observacao}
                                disabled={somenteLeitura}
                                onChange={(e) => atualizarLinha(linha.id, { observacao: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {!somenteLeitura && (
                        <>
                          <button
                            type="button"
                            className={styles.addBtn}
                            onClick={() => {
                              setBuscaMomento((atual) => (atual === secao.codigo ? null : secao.codigo));
                              setTermoBusca('');
                            }}
                          >
                            Selecionar música
                          </button>
                          {buscaMomento === secao.codigo && (
                            <div className={styles.buscaBox}>
                              <input
                                className={styles.input}
                                placeholder="Pesquisar música"
                                value={termoBusca}
                                onChange={(e) => setTermoBusca(e.target.value)}
                                autoFocus
                              />
                              {buscando && <p className={styles.vazioBusca}>Buscando...</p>}
                              {!buscando && resultados.length === 0 && (
                                <p className={styles.vazioBusca}>Nenhuma música encontrada.</p>
                              )}
                              {resultados.map((musica) => (
                                <button
                                  key={musica.codigo}
                                  type="button"
                                  className={styles.resultado}
                                  onClick={() => adicionarMusica(secao.codigo, musica)}
                                >
                                  <span className={styles.resultadoTitulo}>{musica.titulo}</span>
                                  <span className={styles.resultadoMeta}>
                                    {[musica.autor, musica.tomPadrao ? `Tom ${musica.tomPadrao}` : null]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  );
                })}
              </div>

              <div className={styles.campo}>
                <label htmlFor="repertorio-observacao">Observação do repertório</label>
                <textarea
                  id="repertorio-observacao"
                  className={styles.input}
                  rows={3}
                  value={observacao}
                  disabled={somenteLeitura}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              <div className="modalActions" style={{ marginTop: '1rem' }}>
                <button type="button" className="modalBtnSecondary" onClick={fecharModal} disabled={salvando}>
                  {somenteLeitura ? 'Fechar' : 'Cancelar'}
                </button>
                {!somenteLeitura && (
                  <button type="submit" className="modalBtnPrimary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(excluirAlvo)}
        title="Limpar repertório"
        message="As músicas serão desativadas e o histórico do repertório será preservado. Continuar?"
        confirmLabel="Limpar"
        variant="danger"
        confirmLoading={excluindo}
        onCancel={() => setExcluirAlvo(null)}
        onConfirm={() => {
          if (!excluirAlvo?.repertorioCodigo) return;
          setExcluindo(true);
          repertoriosService
            .excluir(excluirAlvo.repertorioCodigo)
            .then(() => {
              notifySuccess(AppMessages.repertorio.excluido);
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
