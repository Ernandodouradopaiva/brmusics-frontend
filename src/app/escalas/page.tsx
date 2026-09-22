'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifyError, notifySuccess, notifyWarning } from '@/lib/notify';
import { podeListarEscalas } from '@/lib/permissions';
import { escalasService } from '@/services/escalas';
import { musicosService } from '@/services/musicos';
import { instrumentosService } from '@/services/instrumentos';
import { whatsappService } from '@/services/whatsapp';
import type {
  EscalaConfirmacaoStatus,
  EscalaMensalItem,
  EscalaMusicoInput,
  EscalaPublicacaoPrevia,
  Instrumento,
  Musico,
  WhatsAppComunicacaoItem,
  WhatsAppComunicacaoPrevia,
} from '@/types/api';
import { ListagemTitulo, ListagemPageWrapper } from '@/components/listagem';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import listagemStyles from '@/components/listagem/listagem.module.css';
import styles from './escalas.module.css';

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
const STATUS_CONFIRMACAO: { value: EscalaConfirmacaoStatus; label: string }[] = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'RECUSADO', label: 'Recusado' },
];

type LinhaEquipe = EscalaMusicoInput & { id: string };

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

function novaLinha(musicoCodigo = '', instrumentoCodigo = ''): LinhaEquipe {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    musicoCodigo,
    instrumentoCodigo,
    observacao: '',
    statusConfirmacao: 'PENDENTE',
  };
}

function nomeMusico(m: Musico): string {
  return m.nomeArtistico?.trim() || m.nome;
}

function badgeConfirmacao(status: EscalaConfirmacaoStatus): string {
  if (status === 'CONFIRMADO') return `${styles.badge} ${styles.badgeConfirmado}`;
  if (status === 'RECUSADO') return `${styles.badge} ${styles.badgeRecusado}`;
  return `${styles.badge} ${styles.badgePendente}`;
}

function labelConfirmacao(status: EscalaConfirmacaoStatus): string {
  return STATUS_CONFIRMACAO.find((s) => s.value === status)?.label ?? status;
}

function emitirAlertas(alertas?: string[] | null) {
  if (!alertas?.length) return;
  for (const alerta of alertas) {
    notifyWarning(alerta);
  }
}

function agruparAlteracoes(itens: WhatsAppComunicacaoItem[]) {
  const grupos: { chave: string; nome: string; itens: WhatsAppComunicacaoItem[] }[] = [];
  const indice = new Map<string, number>();
  for (const item of itens) {
    const chave = item.musicoCodigo || item.musicoNome;
    const pos = indice.get(chave);
    if (pos === undefined) {
      indice.set(chave, grupos.length);
      grupos.push({ chave, nome: item.musicoNome, itens: [item] });
    } else {
      grupos[pos].itens.push(item);
    }
  }
  return grupos;
}

export default function EscalasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarEscalas(user);
  const hoje = useMemo(() => new Date(), []);

  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [itens, setItens] = useState<EscalaMensalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [musicos, setMusicos] = useState<Musico[]>([]);
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [somenteLeitura, setSomenteLeitura] = useState(false);
  const [itemAtual, setItemAtual] = useState<EscalaMensalItem | null>(null);
  const [linhas, setLinhas] = useState<LinhaEquipe[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [copiarOpen, setCopiarOpen] = useState(false);
  const [origemCopia, setOrigemCopia] = useState('');
  const [copiando, setCopiando] = useState(false);
  const [excluirAlvo, setExcluirAlvo] = useState<EscalaMensalItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [previa, setPrevia] = useState<EscalaPublicacaoPrevia | null>(null);
  const [publicarOpen, setPublicarOpen] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [publicarItem, setPublicarItem] = useState<EscalaMensalItem | null>(null);
  const [publicandoItem, setPublicandoItem] = useState(false);
  const [comunicacao, setComunicacao] = useState<WhatsAppComunicacaoPrevia | null>(null);
  const [comunicando, setComunicando] = useState(false);

  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anoAnterior = mes === 1 ? ano - 1 : ano;
  const mesSeguinte = mes === 12 ? 1 : mes + 1;
  const anoSeguinte = mes === 12 ? ano + 1 : ano;

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    Promise.all([
      escalasService.listarMensal(ano, mes),
      escalasService.previaPublicacao(ano, mes).catch(() => ({ data: null })),
    ])
      .then(([lista, previaRes]) => {
        setItens(lista.data ?? []);
        setPrevia(previaRes.data);
        const versao = previaRes.data?.versaoAtual;
        if (versao && versao >= 2) {
          return whatsappService
            .previaComunicacao(ano, mes)
            .then((c) => setComunicacao(c.data))
            .catch(() => setComunicacao(null));
        }
        setComunicacao(null);
      })
      .catch((err) => {
        setItens([]);
        setPrevia(null);
        setComunicacao(null);
        notifyApiError(err, { toastId: 'escalas-erro-lista' });
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
    musicosService
      .listar({ page: 0, size: 200, sort: 'nome', ativo: true })
      .then((res) => setMusicos(res.data.content ?? []))
      .catch(() => setMusicos([]));
    instrumentosService
      .listar({ page: 0, size: 200, sort: 'ordem', ativo: true })
      .then((res) => setInstrumentos(res.data.content ?? []))
      .catch(() => setInstrumentos([]));
  }, []);

  const abrirEditor = (item: EscalaMensalItem, leitura: boolean) => {
    setItemAtual(item);
    setSomenteLeitura(leitura);
    setLinhas(
      (item.participacoes ?? []).map((p) => ({
        id: p.codigo || novaLinha().id,
        musicoCodigo: p.musicoCodigo,
        instrumentoCodigo: p.instrumentoCodigo,
        observacao: p.observacao ?? '',
        statusConfirmacao: p.statusConfirmacao ?? 'PENDENTE',
      }))
    );
    setModalOpen(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalOpen(false);
    setItemAtual(null);
    setLinhas([]);
  };

  const instrumentosDoMusico = (musicoCodigo: string): Instrumento[] => {
    const musico = musicos.find((m) => m.codigo === musicoCodigo);
    const doMusico = musico?.instrumentos ?? [];
    if (doMusico.length > 0) return doMusico;
    return instrumentos;
  };

  const adicionarLinha = () => {
    const primeiro = musicos[0];
    const funcs = primeiro ? instrumentosDoMusico(primeiro.codigo) : instrumentos;
    setLinhas((atual) => [...atual, novaLinha(primeiro?.codigo ?? '', funcs[0]?.codigo ?? '')]);
  };

  const atualizarLinha = (id: string, patch: Partial<LinhaEquipe>) => {
    setLinhas((atual) =>
      atual.map((linha) => {
        if (linha.id !== id) return linha;
        const next = { ...linha, ...patch };
        if (patch.musicoCodigo && patch.musicoCodigo !== linha.musicoCodigo) {
          const funcs = instrumentosDoMusico(patch.musicoCodigo);
          next.instrumentoCodigo = funcs[0]?.codigo ?? '';
        }
        return next;
      })
    );
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemAtual || somenteLeitura) return;
    const chaves = new Set<string>();
    for (const linha of linhas) {
      if (!linha.musicoCodigo || !linha.instrumentoCodigo) {
        notifyError(AppMessages.validacao.campoObrigatorio('músico e função de cada participação'));
        return;
      }
      const chave = `${linha.musicoCodigo}:${linha.instrumentoCodigo}`;
      if (chaves.has(chave)) {
        notifyError('O mesmo músico não pode ser escalado duas vezes com a mesma função.');
        return;
      }
      chaves.add(chave);
    }
    setSalvando(true);
    try {
      const body = {
        celebracaoCodigo: itemAtual.celebracaoCodigo,
        participacoes: linhas.map((linha) => ({
          musicoCodigo: linha.musicoCodigo,
          instrumentoCodigo: linha.instrumentoCodigo,
          observacao: linha.observacao?.trim() || null,
          statusConfirmacao: linha.statusConfirmacao ?? 'PENDENTE',
        })),
      };
      const res = itemAtual.escalaCodigo
        ? await escalasService.atualizar(itemAtual.escalaCodigo, body)
        : await escalasService.criar(body);
      notifySuccess(AppMessages.escala.salvo(Boolean(itemAtual.escalaCodigo)));
      emitirAlertas(res.data.alertas);
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setSalvando(false);
    }
  };

  const duplicarAnterior = async (item: EscalaMensalItem) => {
    try {
      const res = await escalasService.duplicarAnterior(item.celebracaoCodigo);
      notifySuccess(AppMessages.escala.duplicada);
      emitirAlertas(res.data.alertas);
      loadData();
    } catch (err) {
      notifyApiError(err);
    }
  };

  const copiarEquipe = async () => {
    if (!itemAtual || !origemCopia) {
      notifyError('Selecione a celebração de origem.');
      return;
    }
    setCopiando(true);
    try {
      const res = await escalasService.copiar(origemCopia, itemAtual.celebracaoCodigo);
      notifySuccess(AppMessages.escala.copiada);
      emitirAlertas(res.data.alertas);
      setCopiarOpen(false);
      setOrigemCopia('');
      fecharModal();
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setCopiando(false);
    }
  };

  const abrirPublicacao = () => {
    if (!previa) {
      escalasService
        .previaPublicacao(ano, mes)
        .then((res) => {
          setPrevia(res.data);
          if (!res.data.podePublicar) {
            notifyError(res.data.impedimentos[0] || 'Não é possível publicar as escalas deste mês.');
            return;
          }
          setPublicarOpen(true);
        })
        .catch((err) => notifyApiError(err));
      return;
    }
    if (!previa.podePublicar) {
      notifyError(previa.impedimentos[0] || 'Não é possível publicar as escalas deste mês.');
      return;
    }
    setPublicarOpen(true);
  };

  const confirmarPublicacao = () => {
    setPublicando(true);
    escalasService
      .publicar(ano, mes)
      .then((res) => {
        notifySuccess(AppMessages.escala.publicada(res.data.versao, previa?.competencia || `${MESES[mes - 1]}/${ano}`));
        setPublicarOpen(false);
        loadData();
      })
      .catch((err) => notifyApiError(err))
      .finally(() => setPublicando(false));
  };

  const abrirPublicacaoIndividual = (item: EscalaMensalItem) => {
    if (!item.escalaCodigo) {
      notifyError('Monte e salve a escala antes de publicar.');
      return;
    }
    if ((item.quantidadeMusicos ?? 0) <= 0) {
      notifyError('Inclua pelo menos um músico na escala antes de publicar.');
      return;
    }
    setPublicarItem(item);
  };

  const confirmarPublicacaoIndividual = () => {
    if (!publicarItem?.escalaCodigo || publicandoItem) return;
    setPublicandoItem(true);
    escalasService
      .publicarUma(publicarItem.escalaCodigo)
      .then(() => {
        notifySuccess(AppMessages.escala.publicadaIndividual);
        setPublicarItem(null);
        if (modalOpen && itemAtual?.celebracaoCodigo === publicarItem.celebracaoCodigo) {
          fecharModal();
        }
        loadData();
      })
      .catch((err) => notifyApiError(err))
      .finally(() => setPublicandoItem(false));
  };

  const comunicarAlteracoes = () => {
    if (comunicando || comunicacao?.jaComunicada) return;
    setComunicando(true);
    whatsappService
      .comunicarAlteracoes(ano, mes)
      .then((res) => {
        notifySuccess(AppMessages.whatsapp.alteracoesComunicadas(res.data.enfileirados ?? 0));
        return whatsappService.previaComunicacao(ano, mes).then((c) => setComunicacao(c.data));
      })
      .catch((err) => notifyApiError(err))
      .finally(() => setComunicando(false));
  };

  const origensCopia = itens.filter(
    (i) => i.celebracaoCodigo !== itemAtual?.celebracaoCodigo && (i.quantidadeMusicos ?? 0) > 0
  );

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Escalas" />
        <p className="emptyState">Você não tem permissão para listar escalas.</p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  return (
    <>
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Escalas" />

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
            {previa?.versaoAtual ? (
              <span className={styles.versao}>Versão {previa.versaoAtual}</span>
            ) : null}
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

        <PermissionGate permission="escala.publicar">
          <button type="button" className={styles.btnPublicar} onClick={abrirPublicacao} disabled={loading}>
            PUBLICAR ESCALAS DO MÊS
          </button>
        </PermissionGate>

        {comunicacao && comunicacao.itens.length > 0 && (
          <section className={styles.painelAlteracoes} aria-label="Alterações da escala publicada">
            <p className={styles.alteracoesTitulo}>Alterações encontradas:</p>
            {agruparAlteracoes(comunicacao.itens).map((grupo) => (
              <div key={grupo.chave} className={styles.alteracaoGrupo}>
                <p className={styles.alteracaoMusico}>{grupo.nome}</p>
                {grupo.itens.map((item, indice) => (
                  <p key={`${item.tipo}-${item.resumo}-${indice}`} className={styles.alteracaoResumo}>
                    {item.resumo}
                  </p>
                ))}
              </div>
            ))}
            {comunicacao.jaComunicada ? (
              <p className={styles.alteracoesJaComunicadas}>Alterações já comunicadas por WhatsApp.</p>
            ) : (
              <PermissionGate permission="whatsapp.enviar">
                <button
                  type="button"
                  className={styles.btnComunicar}
                  onClick={comunicarAlteracoes}
                  disabled={comunicando}
                >
                  {comunicando ? 'Comunicando...' : 'Reenviar alterações (WhatsApp)'}
                </button>
              </PermissionGate>
            )}
          </section>
        )}

        {loading && <LoadingSpinner label="Carregando escalas..." />}

        {!loading && itens.length === 0 && (
          <p className="emptyState">
            Nenhuma celebração cadastrada em {MESES[mes - 1].toLowerCase()} de {ano}. Cadastre as missas em
            Celebrações para montar a escala.
          </p>
        )}

        {!loading && itens.length > 0 && (
          <div className={styles.agenda}>
            {itens.map((item) => {
              const publicada = item.escalaStatus === 'PUBLICADA';
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
                    {item.celebracaoTipo === 'FIXA' && (
                      <span className={`${styles.badge} ${styles.badgeFixa}`}>Fixa</span>
                    )}
                    {item.celebracaoTipo === 'EXTRAORDINARIA' && (
                      <span className={`${styles.badge} ${styles.badgeExtra}`}>Extraordinária</span>
                    )}
                    <h3 className={styles.titulo}>{item.titulo}</h3>
                    <p className={styles.meta}>
                      {item.diaSemana || '—'} • {horaInput(item.horaInicio)}
                      {item.horaFim ? ` – ${horaInput(item.horaFim)}` : ''}
                    </p>
                    <p className={styles.meta}>{item.localNome || '—'}</p>
                    <p className={styles.qtd}>
                      {item.quantidadeMusicos} {item.quantidadeMusicos === 1 ? 'músico' : 'músicos'}
                    </p>
                    {(item.participacoes ?? []).length > 0 && (
                      <ul className={styles.equipe}>
                        {item.participacoes.map((p) => (
                          <li key={`${p.musicoCodigo}-${p.instrumentoCodigo}`}>
                            {p.musicoNome} — {p.instrumentoNome}{' '}
                            <span className={badgeConfirmacao(p.statusConfirmacao)}>
                              {labelConfirmacao(p.statusConfirmacao)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.repertorioCard}>
                    <p className={styles.repertorioTitulo}>Repertório</p>
                    {(item.repertorio ?? []).length > 0 ? (
                      <ul className={styles.repertorioLista}>
                        {item.repertorio!.map((r, indice) => (
                          <li key={r.codigo ?? `${r.musicaCodigo}-${r.momentoLiturgico}-${indice}`}>
                            <span className={styles.repertorioMomento}>
                              {r.momentoLiturgicoRotulo || r.momentoLiturgico}
                            </span>
                            <span className={styles.repertorioMusica}>
                              {r.musicaTitulo}
                              {r.tom ? ` — Tom ${r.tom}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.repertorioVazio}>Sem repertório montado.</p>
                    )}
                  </div>
                  <div className={styles.acoes}>
                    <div className={styles.acoesPrincipais}>
                      {!publicada && !cancelada && (
                        <button
                          type="button"
                          className={styles.btnPublicarCard}
                          onClick={() => abrirPublicacaoIndividual(item)}
                          disabled={publicandoItem}
                        >
                          Publicar
                        </button>
                      )}
                      <PermissionGate permission={item.escalaCodigo ? 'escala.editar' : 'escala.criar'}>
                        <button
                          type="button"
                          className={styles.btnEditarCard}
                          onClick={() => abrirEditor(item, false)}
                        >
                          {item.escalaCodigo ? 'Editar' : 'Montar'}
                        </button>
                      </PermissionGate>
                    </div>
                    <PermissionGate permission="escala.visualizar">
                      <button
                        type="button"
                        className={listagemStyles.btnAcaoExtra}
                        onClick={() => abrirEditor(item, true)}
                      >
                        Ver
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="repertorio.pagina">
                      <button
                        type="button"
                        className={listagemStyles.btnAcaoExtra}
                        onClick={() =>
                          router.push(
                            `/repertorios?celebracao=${item.celebracaoCodigo}&ano=${ano}&mes=${mes}`
                          )
                        }
                      >
                        Ver repertório
                      </button>
                    </PermissionGate>
                    <PermissionGate anyOf={['escala.criar', 'escala.editar']}>
                      <button
                        type="button"
                        className={listagemStyles.btnAcaoExtra}
                        onClick={() => void duplicarAnterior(item)}
                      >
                        Duplicar anterior
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="escala.excluir">
                      {item.escalaCodigo && (item.quantidadeMusicos ?? 0) > 0 && (
                        <button
                          type="button"
                          className={listagemStyles.btnAcaoExtra}
                          onClick={() => setExcluirAlvo(item)}
                        >
                          Limpar equipe
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
              {somenteLeitura ? 'Escala' : itemAtual.escalaCodigo ? 'Editar escala' : 'Montar escala'}
            </h2>
            <p className={styles.meta}>
              {diaDoIso(itemAtual.data)}/{mesCurto(itemAtual.data)} • {itemAtual.diaSemana} •{' '}
              {horaInput(itemAtual.horaInicio)} — {itemAtual.titulo}
            </p>

            <form onSubmit={(e) => void salvar(e)}>
              <div className={styles.equipeForm}>
                {linhas.length === 0 && <p className="emptyState">Nenhum músico na escala ainda.</p>}
                {linhas.map((linha, idx) => {
                  const musico = musicos.find((m) => m.codigo === linha.musicoCodigo);
                  const funcs = musico ? instrumentosDoMusico(linha.musicoCodigo) : instrumentos;
                  const extra =
                    linha.instrumentoCodigo && !funcs.some((f) => f.codigo === linha.instrumentoCodigo)
                      ? instrumentos.find((f) => f.codigo === linha.instrumentoCodigo)
                      : null;
                  const opcoes = extra ? [extra, ...funcs] : funcs;
                  const instrumentoDoMusico = Boolean(
                    musico?.instrumentos?.some((i) => i.codigo === linha.instrumentoCodigo)
                  );
                  return (
                    <div key={linha.id} className={styles.linha}>
                      <div className={styles.linhaHeader}>
                        <strong>Músico {idx + 1}</strong>
                        {!somenteLeitura && (
                          <button
                            type="button"
                            className={listagemStyles.btnAcaoExtra}
                            onClick={() => setLinhas((atual) => atual.filter((l) => l.id !== linha.id))}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      <div className={styles.campo}>
                        <label htmlFor={`musico-${linha.id}`}>Músico</label>
                        <select
                          id={`musico-${linha.id}`}
                          className={styles.select}
                          value={linha.musicoCodigo}
                          disabled={somenteLeitura}
                          onChange={(e) => atualizarLinha(linha.id, { musicoCodigo: e.target.value })}
                        >
                          <option value="">Selecione</option>
                          {linha.musicoCodigo && !musicos.some((m) => m.codigo === linha.musicoCodigo) && (
                            <option value={linha.musicoCodigo}>
                              {itemAtual.participacoes.find((p) => p.musicoCodigo === linha.musicoCodigo)?.musicoNome
                                ?? 'Músico vinculado'}
                            </option>
                          )}
                          {musicos.map((m) => (
                            <option key={m.codigo} value={m.codigo}>
                              {nomeMusico(m)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.campo}>
                        <label htmlFor={`funcao-${linha.id}`}>Instrumento / função</label>
                        <select
                          id={`funcao-${linha.id}`}
                          className={styles.select}
                          value={linha.instrumentoCodigo}
                          disabled={somenteLeitura}
                          onChange={(e) => atualizarLinha(linha.id, { instrumentoCodigo: e.target.value })}
                        >
                          <option value="">Selecione</option>
                          {opcoes.map((i) => (
                            <option key={i.codigo} value={i.codigo}>
                              {i.nome}
                            </option>
                          ))}
                        </select>
                        {linha.musicoCodigo && linha.instrumentoCodigo && !instrumentoDoMusico && (
                          <p className={styles.avisoInstrumento}>
                            Este instrumento não está cadastrado para o músico. A escala será aceita, com alerta.
                          </p>
                        )}
                      </div>
                      <div className={styles.campo}>
                        <label htmlFor={`status-${linha.id}`}>Confirmação</label>
                        <select
                          id={`status-${linha.id}`}
                          className={styles.select}
                          value={linha.statusConfirmacao}
                          disabled={somenteLeitura}
                          onChange={(e) =>
                            atualizarLinha(linha.id, {
                              statusConfirmacao: e.target.value as EscalaConfirmacaoStatus,
                            })
                          }
                        >
                          {STATUS_CONFIRMACAO.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.campo}>
                        <label htmlFor={`obs-${linha.id}`}>Observação</label>
                        <input
                          id={`obs-${linha.id}`}
                          className={styles.input}
                          data-no-uppercase
                          value={linha.observacao ?? ''}
                          disabled={somenteLeitura}
                          onChange={(e) => atualizarLinha(linha.id, { observacao: e.target.value })}
                        />
                      </div>
                    </div>
                  );
                })}
                {!somenteLeitura && (
                  <button type="button" className={styles.addBtn} onClick={adicionarLinha}>
                    Adicionar músico
                  </button>
                )}
              </div>

              <div className="modalActions">
                <button type="button" className="modalBtnSecondary" onClick={fecharModal} disabled={salvando}>
                  {somenteLeitura ? 'Fechar' : 'Cancelar'}
                </button>
                {!somenteLeitura && (
                  <>
                    <PermissionGate anyOf={['escala.criar', 'escala.editar']}>
                      <button
                        type="button"
                        className="modalBtnSecondary"
                        disabled={salvando}
                        onClick={() => setCopiarOpen(true)}
                      >
                        Copiar equipe
                      </button>
                    </PermissionGate>
                    {itemAtual.escalaCodigo
                      && itemAtual.escalaStatus !== 'PUBLICADA'
                      && itemAtual.celebracaoStatus !== 'CANCELADA'
                      && linhas.length > 0 && (
                      <button
                        type="button"
                        className={styles.btnPublicarCard}
                        disabled={salvando || publicandoItem}
                        onClick={() => abrirPublicacaoIndividual(itemAtual)}
                      >
                        Publicar
                      </button>
                    )}
                    <button type="submit" className="modalBtnPrimary" disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {copiarOpen && itemAtual && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <ModalCloseButton onClose={() => setCopiarOpen(false)} disabled={copiando} />
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600, paddingRight: '2.5rem' }}>
              Copiar equipe
            </h2>
            <p className={styles.meta} style={{ marginBottom: '0.75rem' }}>
              Escolha uma celebração deste mês para copiar os músicos para {itemAtual.titulo}.
            </p>
            <select
              className={styles.select}
              value={origemCopia}
              onChange={(e) => setOrigemCopia(e.target.value)}
            >
              <option value="">Selecione a origem</option>
              {origensCopia.map((o) => (
                <option key={o.celebracaoCodigo} value={o.celebracaoCodigo}>
                  {diaDoIso(o.data)}/{mesCurto(o.data)} • {horaInput(o.horaInicio)} — {o.titulo}
                </option>
              ))}
            </select>
            {origensCopia.length === 0 && (
              <p className="emptyState">Não há outra celebração com equipe neste mês.</p>
            )}
            <div className="modalActions" style={{ marginTop: '1rem' }}>
              <button type="button" className="modalBtnSecondary" onClick={() => setCopiarOpen(false)} disabled={copiando}>
                Cancelar
              </button>
              <button
                type="button"
                className="modalBtnPrimary"
                disabled={copiando || !origemCopia}
                onClick={() => void copiarEquipe()}
              >
                {copiando ? 'Copiando...' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={publicarOpen && Boolean(previa)}
        title={`Publicar escalas de ${previa?.competencia ?? ''}?`}
        message={
          previa?.versaoAtual
            ? `Será gerada a versão ${previa.proximaVersao} (atual: versão ${previa.versaoAtual}). Os músicos afetados pelas alterações serão notificados automaticamente por WhatsApp.`
            : 'A primeira versão será registrada. Os músicos serão notificados por WhatsApp.'
        }
        confirmLabel={publicando ? 'Publicando...' : 'Publicar'}
        confirmLoading={publicando}
        onCancel={() => setPublicarOpen(false)}
        onConfirm={confirmarPublicacao}
      >
        {previa && (
          <ul className={styles.resumoPublicacao}>
            <li>
              Quantidade de celebrações: <strong>{previa.quantidadeCelebracoes}</strong>
            </li>
            <li>
              Quantidade de músicos envolvidos: <strong>{previa.quantidadeMusicos}</strong>
            </li>
            <li>
              Quantidade de escalas: <strong>{previa.quantidadeEscalas}</strong>
            </li>
          </ul>
        )}
        {previa && (previa.alteracoes ?? []).length > 0 && (
          <div className={styles.diffs}>
            <p className={styles.diffsTitulo}>Alterações em relação à versão {previa.versaoAtual}</p>
            <ul>
              {(previa.alteracoes ?? []).map((alt, indice) => (
                <li key={`${alt.tipo}-${indice}`}>{alt.descricao}</li>
              ))}
            </ul>
          </div>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(publicarItem)}
        title="Publicar esta escala?"
        message={
          publicarItem
            ? `A escala de ${publicarItem.titulo} (${diaDoIso(publicarItem.data)}/${mesCurto(publicarItem.data)}) será marcada como publicada. É necessário ter músicos e repertório cadastrados.`
            : ''
        }
        confirmLabel={publicandoItem ? 'Publicando...' : 'Publicar'}
        confirmLoading={publicandoItem}
        onCancel={() => setPublicarItem(null)}
        onConfirm={confirmarPublicacaoIndividual}
      />

      <ConfirmModal
        open={Boolean(excluirAlvo)}
        title="Limpar equipe"
        message="A equipe será desativada e o histórico da escala será preservado. Continuar?"
        confirmLabel="Limpar"
        variant="danger"
        confirmLoading={excluindo}
        onCancel={() => setExcluirAlvo(null)}
        onConfirm={() => {
          if (!excluirAlvo?.escalaCodigo) return;
          setExcluindo(true);
          escalasService
            .excluir(excluirAlvo.escalaCodigo)
            .then(() => {
              notifySuccess(AppMessages.escala.excluido);
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
