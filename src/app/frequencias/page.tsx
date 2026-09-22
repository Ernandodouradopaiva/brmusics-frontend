'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { AppMessages, notifyApiError, notifySuccess } from '@/lib/notify';
import { hasPermission, podeListarFrequencias } from '@/lib/permissions';
import { frequenciasService, toSalvarItem } from '@/services/frequencias';
import type { FrequenciaMensalItem, FrequenciaStatus } from '@/types/api';
import { ListagemPageWrapper, ListagemTitulo } from '@/components/listagem';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import styles from './frequencias.module.css';

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

const STATUS_OPCOES: { value: FrequenciaStatus | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'PRESENTE', label: 'Presente' },
  { value: 'FALTOU', label: 'Faltou' },
  { value: 'DISPENSADO', label: 'Foi dispensado' },
  { value: 'NAO_MINISTERIO', label: 'Não é do Ministério' },
];

type SemanaKey = 'semana1' | 'semana2' | 'semana3' | 'semana4';

const SEMANAS: { key: SemanaKey; label: string }[] = [
  { key: 'semana1', label: '1ª semana' },
  { key: 'semana2', label: '2ª semana' },
  { key: 'semana3', label: '3ª semana' },
  { key: 'semana4', label: '4ª semana' },
];

export default function FrequenciasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const podeListar = podeListarFrequencias(user);
  const podeEditar = hasPermission(user, 'frequencia.editar');

  const hoje = useMemo(() => new Date(), []);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [itens, setItens] = useState<FrequenciaMensalItem[]>([]);
  const [competencia, setCompetencia] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [dirty, setDirty] = useState(false);

  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anoAnterior = mes === 1 ? ano - 1 : ano;
  const mesSeguinte = mes === 12 ? 1 : mes + 1;
  const anoSeguinte = mes === 12 ? ano + 1 : ano;

  const loadData = useCallback(() => {
    if (!podeListar) return;
    setLoading(true);
    frequenciasService
      .listarMensal(ano, mes)
      .then((res) => {
        setItens(res.data.itens ?? []);
        setCompetencia(res.data.competencia || `${MESES[mes - 1]} ${ano}`);
        setDirty(false);
      })
      .catch((err) => {
        notifyApiError(err);
        setItens([]);
      })
      .finally(() => setLoading(false));
  }, [ano, mes, podeListar]);

  useEffect(() => {
    if (authLoading || !podeListar) return;
    loadData();
  }, [authLoading, podeListar, loadData]);

  const alterarStatus = (musicoCodigo: string, semana: SemanaKey, valor: string) => {
    const status = (valor || null) as FrequenciaStatus | null;
    setItens((atual) =>
      atual.map((item) =>
        item.musicoCodigo === musicoCodigo ? { ...item, [semana]: status } : item
      )
    );
    setDirty(true);
  };

  const salvar = () => {
    if (!podeEditar || salvando) return;
    setSalvando(true);
    frequenciasService
      .salvarMensal(
        ano,
        mes,
        itens.map((item) => toSalvarItem(item))
      )
      .then((res) => {
        setItens(res.data.itens ?? []);
        setCompetencia(res.data.competencia || competencia);
        setDirty(false);
        notifySuccess(AppMessages.frequencia.salva);
      })
      .catch((err) => notifyApiError(err))
      .finally(() => setSalvando(false));
  };

  if (authLoading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (!podeListar) {
    return (
      <ListagemPageWrapper>
        <ListagemTitulo recurso="Frequência" />
        <p className="emptyState">Você não tem permissão para listar frequências.</p>
        <button type="button" className="modalBtnSecondary" onClick={() => router.replace('/home')}>
          Voltar ao início
        </button>
      </ListagemPageWrapper>
    );
  }

  return (
    <ListagemPageWrapper>
      <ListagemTitulo recurso="Frequência" />
      <p className={styles.intro}>
        Registre a presença nas 4 reuniões semanais do mês. Opções: Presente, Faltou, Foi dispensado ou
        Não é do Ministério.
      </p>

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
        <h2 className={styles.mesAtual}>{competencia || `${MESES[mes - 1]} ${ano}`}</h2>
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

      <PermissionGate permission="frequencia.editar">
        <div className={styles.barraAcoes}>
          <button
            type="button"
            className={styles.btnSalvar}
            onClick={salvar}
            disabled={salvando || !dirty || loading}
          >
            {salvando ? 'Salvando...' : 'Salvar frequências'}
          </button>
          {dirty && <span className={styles.avisoDirty}>Alterações não salvas</span>}
        </div>
      </PermissionGate>

      {loading && <LoadingSpinner label="Carregando frequências..." />}

      {!loading && itens.length === 0 && (
        <p className="emptyState">Nenhum músico ativo cadastrado para registrar frequência.</p>
      )}

      {!loading && itens.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th scope="col">Músico</th>
                {SEMANAS.map((s) => (
                  <th key={s.key} scope="col">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.musicoCodigo}>
                  <td className={styles.nome}>{item.musicoNome}</td>
                  {SEMANAS.map((s) => (
                    <td key={s.key}>
                      <select
                        className={styles.select}
                        value={item[s.key] ?? ''}
                        disabled={!podeEditar || salvando}
                        onChange={(e) => alterarStatus(item.musicoCodigo, s.key, e.target.value)}
                        aria-label={`${item.musicoNome} — ${s.label}`}
                      >
                        {STATUS_OPCOES.map((op) => (
                          <option key={op.value || 'vazio'} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ListagemPageWrapper>
  );
}
