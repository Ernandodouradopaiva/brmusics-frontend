'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifySuccess } from '@/lib/notify';
import { hasPermission, podeListarWhatsApp } from '@/lib/permissions';
import { whatsappService } from '@/services/whatsapp';
import type { WhatsAppEnvio, WhatsAppEnvioStatus, WhatsAppTipoMensagem } from '@/types/api';
import {
  ListagemTitulo,
  ListagemBar,
  ListagemTable,
  ListagemPanel,
  ListagemPageWrapper,
  ListagemPagination,
} from '@/components/listagem';
import type { Coluna } from '@/components/listagem';
import { ModalCloseButton } from '@/components/ModalCloseButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmModal } from '@/components/ConfirmModal';
import listagemStyles from '@/components/listagem/listagem.module.css';
import musicoStyles from '@/app/musicos/musicos.module.css';
import styles from './whatsapp.module.css';

const DEFAULT_PAGE_SIZE = 5;

const TIPOS: { value: WhatsAppTipoMensagem | ''; label: string }[] = [
  { value: '', label: 'Todos os tipos' },
  { value: 'PUBLICACAO_ESCALA', label: 'Publicação da escala' },
  { value: 'NOVA_ESCALA', label: 'Nova escala' },
  { value: 'ALTERACAO_ESCALA', label: 'Alteração da escala' },
  { value: 'REMOCAO_ESCALA', label: 'Remoção da escala' },
  { value: 'ALTERACAO_REPERTORIO', label: 'Alteração de repertório' },
  { value: 'CELEBRACAO_CANCELADA', label: 'Celebração cancelada' },
  { value: 'LEMBRETE', label: 'Lembrete' },
];

const STATUS: { value: WhatsAppEnvioStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PROCESSANDO', label: 'Processando' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ERRO', label: 'Erro' },
];

function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString('pt-BR');
}

function statusComEmoji(status: WhatsAppEnvioStatus): string {
  if (status === 'ENVIADO') return '✅ Enviado';
  if (status === 'ERRO') return '❌ Erro';
  if (status === 'PROCESSANDO') return '⏳ Processando';
  return '⏳ Pendente';
}

function StatusChip({ status }: { status: WhatsAppEnvioStatus; rotulo?: string | null }) {
  const classe =
    status === 'ENVIADO'
      ? styles.enviado
      : status === 'ERRO'
        ? styles.erro
        : status === 'PROCESSANDO'
          ? styles.processando
          : styles.pendente;
  return <span className={`${styles.chip} ${classe}`}>{statusComEmoji(status)}</span>;
}

export default function WhatsAppPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarWhatsApp(user);
  const agora = new Date();

  const [lista, setLista] = useState<WhatsAppEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [status, setStatus] = useState<WhatsAppEnvioStatus | ''>('');
  const [tipo, setTipo] = useState<WhatsAppTipoMensagem | ''>('');
  const [somenteErros, setSomenteErros] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [detalhe, setDetalhe] = useState<WhatsAppEnvio | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const [reenviarAlvo, setReenviarAlvo] = useState<WhatsAppEnvio | null>(null);
  const [reenviando, setReenviando] = useState(false);
  const [loteOpen, setLoteOpen] = useState(false);
  const [reenviandoLote, setReenviandoLote] = useState(false);
  const [lembreteOpen, setLembreteOpen] = useState(false);
  const [lembreteAno, setLembreteAno] = useState(agora.getFullYear());
  const [lembreteMes, setLembreteMes] = useState(agora.getMonth() + 1);
  const [enviandoLembrete, setEnviandoLembrete] = useState(false);

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
    whatsappService
      .listar({
        musico: buscaDebounced,
        status,
        tipoMensagem: tipo,
        somenteErros,
        page,
        size: pageSize,
        sort: 'dataSolicitacao,desc',
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
        notifyApiError(err, { toastId: 'whatsapp-erro-lista' });
      })
      .finally(() => setLoading(false));
  }, [podeListar, buscaDebounced, status, tipo, somenteErros, page, pageSize]);

  useEffect(() => {
    if (authLoading) return;
    if (!podeListar) {
      setLoading(false);
      setLista([]);
      return;
    }
    loadData();
  }, [authLoading, podeListar, loadData]);

  const abrirDetalhe = async (item: WhatsAppEnvio) => {
    setDetalhe(item);
    setDetalheLoading(true);
    try {
      const res = await whatsappService.buscar(item.codigo);
      setDetalhe(res.data);
    } catch (err) {
      notifyApiError(err, { toastId: 'whatsapp-erro-detalhe' });
    } finally {
      setDetalheLoading(false);
    }
  };

  const confirmarReenvio = async () => {
    if (!reenviarAlvo) return;
    setReenviando(true);
    try {
      await whatsappService.reenviar(reenviarAlvo.codigo);
      notifySuccess(AppMessages.whatsapp.reenviado);
      setReenviarAlvo(null);
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setReenviando(false);
    }
  };

  const confirmarLote = async () => {
    setReenviandoLote(true);
    try {
      const res = await whatsappService.reenviarPendentes();
      notifySuccess(AppMessages.whatsapp.reenviadosLote(res.data.reenviados ?? 0));
      setLoteOpen(false);
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setReenviandoLote(false);
    }
  };

  const confirmarLembrete = async () => {
    setEnviandoLembrete(true);
    try {
      const res = await whatsappService.lembretes(lembreteAno, lembreteMes);
      notifySuccess(AppMessages.whatsapp.lembretesEnfileirados(res.data.enfileirados ?? 0));
      setLembreteOpen(false);
      loadData();
    } catch (err) {
      notifyApiError(err);
    } finally {
      setEnviandoLembrete(false);
    }
  };

  const renderAcoes = useCallback(
    (item: WhatsAppEnvio) => (
      <div className={musicoStyles.cardActions} style={{ borderTop: 'none', paddingTop: 0 }}>
        <PermissionGate permission="whatsapp.visualizar">
          <button
            type="button"
            className={listagemStyles.btnAcaoExtra}
            onClick={() => void abrirDetalhe(item)}
          >
            <Eye size={14} />
            Visualizar
          </button>
        </PermissionGate>
        <PermissionGate permission="whatsapp.reenviar">
          {item.status === 'ERRO' || item.status === 'PENDENTE' ? (
            <button
              type="button"
              className={listagemStyles.btnEditar}
              onClick={() => setReenviarAlvo(item)}
            >
              <RotateCcw size={14} />
              Reenviar
            </button>
          ) : null}
        </PermissionGate>
      </div>
    ),
    []
  );

  const colunas: Coluna<WhatsAppEnvio>[] = useMemo(
    () => [
      {
        key: 'musicoNome',
        label: 'Músico',
        render: (item) => `${item.musicoNome || '—'} ${statusComEmoji(item.status)}`,
      },
      { key: 'telefone', label: 'Telefone' },
      {
        key: 'tipoMensagemRotulo',
        label: 'Tipo',
        render: (item) => item.tipoMensagemRotulo || item.tipoMensagem,
      },
      {
        key: 'status',
        label: 'Status',
        render: (item) => <StatusChip status={item.status} rotulo={item.statusRotulo} />,
      },
      {
        key: 'dataSolicitacao',
        label: 'Solicitado em',
        render: (item) => formatarData(item.dataSolicitacao),
      },
      {
        key: 'acoes',
        label: 'Ações',
        render: renderAcoes,
      },
    ],
    [renderAcoes]
  );

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="WhatsApp" />
        <p className="emptyState">
          Você não tem permissão para listar os envios de WhatsApp. Solicite ao administrador a
          permissão &quot;Listar WhatsApp&quot;.
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
        <ListagemTitulo recurso="WhatsApp" />
        <ListagemBar
          searchPlaceholder="Busque por músico"
          searchValue={busca}
          onSearchChange={setBusca}
          onLimparFiltros={() => {
            setBusca('');
            setStatus('');
            setTipo('');
            setSomenteErros(false);
            setPage(0);
          }}
        >
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-whatsapp-status">Status</label>
            <select
              id="filtro-whatsapp-status"
              className={listagemStyles.barSelect}
              value={somenteErros ? 'ERRO' : status}
              onChange={(e) => {
                const value = e.target.value as WhatsAppEnvioStatus | '';
                setSomenteErros(value === 'ERRO');
                setStatus(value);
                setPage(0);
              }}
            >
              {STATUS.map((opcao) => (
                <option key={opcao.value || 'todos'} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <div className={listagemStyles.barFiltroComLabel}>
            <label htmlFor="filtro-whatsapp-tipo">Tipo</label>
            <select
              id="filtro-whatsapp-tipo"
              className={listagemStyles.barSelect}
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as WhatsAppTipoMensagem | '');
                setPage(0);
              }}
            >
              {TIPOS.map((opcao) => (
                <option key={opcao.value || 'todos'} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <PermissionGate permission="whatsapp.reenviar">
            <button
              type="button"
              className={listagemStyles.btnFiltros}
              onClick={() => setLoteOpen(true)}
            >
              Reenviar pendentes/com erro
            </button>
          </PermissionGate>
          <PermissionGate permission="whatsapp.enviar">
            <button
              type="button"
              className={listagemStyles.btnCadastrar}
              onClick={() => setLembreteOpen(true)}
            >
              Enviar lembretes
            </button>
          </PermissionGate>
        </ListagemBar>

        {loading && <LoadingSpinner label="Carregando envios..." />}

        {!loading && (
          <ListagemPanel>
            <div className={musicoStyles.desktopOnly}>
              <ListagemTable
                colunas={colunas}
                dados={lista}
                rowKey={(item) => item.codigo}
                emptyMessage="Nenhum envio encontrado."
              />
            </div>
            <div className={musicoStyles.mobileCards}>
              {lista.length === 0 ? (
                <p className="emptyState">Nenhum envio encontrado.</p>
              ) : (
                lista.map((item) => (
                  <article key={item.codigo} className={musicoStyles.card}>
                    <div className={musicoStyles.cardHeader}>
                      <div>
                        <h3 className={musicoStyles.cardNome}>
                          {item.musicoNome || '—'} {statusComEmoji(item.status)}
                        </h3>
                        <p className={musicoStyles.cardArtistico}>{item.telefone}</p>
                      </div>
                    </div>
                    <p className={musicoStyles.cardMeta}>
                      {item.tipoMensagemRotulo || item.tipoMensagem} · {formatarData(item.dataSolicitacao)}
                    </p>
                    {renderAcoes(item)}
                  </article>
                ))
              )}
            </div>
            <ListagemPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={pageSize}
              resourceLabel="envios"
              onPageChange={setPage}
              onSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </ListagemPanel>
        )}
      </ListagemPageWrapper>

      {detalhe && (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="whatsapp-modal-titulo">
          <div className="modal">
            <div className="modalHeader">
              <h2 id="whatsapp-modal-titulo">Visualizar envio</h2>
              <ModalCloseButton onClose={() => setDetalhe(null)} />
            </div>
            {detalheLoading ? (
              <LoadingSpinner label="Carregando..." />
            ) : (
              <div className={musicoStyles.detailGrid}>
                <p>
                  <strong>Músico:</strong> {detalhe.musicoNome || '—'}
                </p>
                <p>
                  <strong>Telefone:</strong> {detalhe.telefone}
                </p>
                <p>
                  <strong>Tipo:</strong> {detalhe.tipoMensagemRotulo || detalhe.tipoMensagem}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <StatusChip status={detalhe.status} rotulo={detalhe.statusRotulo} />
                </p>
                <p>
                  <strong>Tentativas:</strong> {detalhe.tentativas}
                </p>
                <p>
                  <strong>Solicitado em:</strong> {formatarData(detalhe.dataSolicitacao)}
                </p>
                <p>
                  <strong>Enviado em:</strong> {formatarData(detalhe.dataEnvio)}
                </p>
                <p>
                  <strong>ID do provedor:</strong> {detalhe.providerMessageId || '—'}
                </p>
                {detalhe.erro ? <p className={styles.erroTexto}>{detalhe.erro}</p> : null}
                <p className={styles.mensagem}>{detalhe.mensagem}</p>
              </div>
            )}
            <div className="modalFooter">
              {hasPermission(user, 'whatsapp.reenviar') &&
              (detalhe.status === 'ERRO' || detalhe.status === 'PENDENTE') ? (
                <button type="button" className="modalBtnPrimary" onClick={() => setReenviarAlvo(detalhe)}>
                  Reenviar
                </button>
              ) : null}
              <button type="button" className="modalBtnSecondary" onClick={() => setDetalhe(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(reenviarAlvo)}
        title="Reenviar mensagem?"
        message="O envio será colocado novamente na fila. Mensagens já enviadas para esta versão da publicação não são duplicadas."
        confirmLabel={reenviando ? 'Reenviando...' : 'Reenviar'}
        confirmLoading={reenviando}
        onCancel={() => setReenviarAlvo(null)}
        onConfirm={() => void confirmarReenvio()}
      />

      <ConfirmModal
        open={loteOpen}
        title="Reenviar pendentes e com erro?"
        message="Somente envios pendentes ou com erro serão reprocessados. Envios já concluídos não serão duplicados."
        confirmLabel={reenviandoLote ? 'Reenviando...' : 'Reenviar pendentes/com erro'}
        confirmLoading={reenviandoLote}
        onCancel={() => setLoteOpen(false)}
        onConfirm={() => void confirmarLote()}
      />

      <ConfirmModal
        open={lembreteOpen}
        title="Enviar lembretes"
        message="Será enfileirado um lembrete para cada músico da última publicação do mês informado."
        confirmLabel={enviandoLembrete ? 'Enfileirando...' : 'Enfileirar'}
        confirmLoading={enviandoLembrete}
        onCancel={() => setLembreteOpen(false)}
        onConfirm={() => void confirmarLembrete()}
      >
        <div className={listagemStyles.filtroLinhaExtra}>
          <label htmlFor="lembrete-ano">Ano</label>
          <input
            id="lembrete-ano"
            type="number"
            min={2000}
            max={2100}
            value={lembreteAno}
            onChange={(e) => setLembreteAno(Number(e.target.value))}
          />
          <label htmlFor="lembrete-mes">Mês</label>
          <input
            id="lembrete-mes"
            type="number"
            min={1}
            max={12}
            value={lembreteMes}
            onChange={(e) => setLembreteMes(Number(e.target.value))}
          />
        </div>
      </ConfirmModal>
    </>
  );
}
