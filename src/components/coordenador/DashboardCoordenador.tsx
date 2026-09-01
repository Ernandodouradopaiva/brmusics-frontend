'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ListMusic,
  MessageCircle,
  Plus,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { hasPermission } from '@/lib/permissions';
import { whatsappService } from '@/services/whatsapp';
import type { DashboardCelebracaoResumo, DashboardCoordenador, WhatsAppEnvio } from '@/types/api';
import { formatarHoraHhMm, primeiroNome } from '@/lib/musicoFormat';
import styles from '@/app/home/home.module.css';

const MESES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function hrefCelebracao(item: DashboardCelebracaoResumo): string {
  return item.escalaCodigo ? '/escalas' : '/celebracoes';
}

function caixaData(iso?: string | null): { dia: string; mes: string } {
  if (!iso) return { dia: '—', mes: '' };
  const [, mes, dia] = String(iso).slice(0, 10).split('-');
  return { dia: dia ?? '—', mes: MESES_CURTO[Number(mes) - 1] ?? '' };
}

function competenciaAtual(): string {
  const texto = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarDataHora(iso?: string | null): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return String(iso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function rotuloStatusEnvio(status: WhatsAppEnvio['status']): string {
  if (status === 'ENVIADO') return 'Enviado';
  if (status === 'ERRO') return 'Erro';
  if (status === 'PROCESSANDO') return 'Processando';
  return 'Pendente';
}

function classeStatusEnvio(status: WhatsAppEnvio['status']): string {
  if (status === 'ENVIADO') return styles.pillOk;
  if (status === 'ERRO') return styles.pillErro;
  return styles.pillNeutro;
}

function DonutEscalas({ publicadas, rascunho }: { publicadas: number; rascunho: number }) {
  const total = publicadas + rascunho;
  const pubPct = total === 0 ? 0 : Math.round((publicadas / total) * 100);
  const fundo =
    total === 0
      ? 'conic-gradient(#d9cfc0 0 100%)'
      : `conic-gradient(#5d8a5a 0 ${pubPct}%, #e2b657 ${pubPct}% 100%)`;
  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut} style={{ background: fundo }} aria-hidden>
        <div className={styles.donutHole}>
          <strong>{publicadas}</strong>
          <span>publicadas</span>
        </div>
      </div>
      <ul className={styles.donutLegenda}>
        <li>
          <span className={`${styles.legendaPonto} ${styles.legendaOk}`} />
          Publicadas <b>{publicadas}</b>
        </li>
        <li>
          <span className={`${styles.legendaPonto} ${styles.legendaAviso}`} />
          Rascunho <b>{rascunho}</b>
        </li>
      </ul>
    </div>
  );
}

export function DashboardCoordenador({
  nome,
  dashboard,
}: {
  nome?: string | null;
  dashboard: DashboardCoordenador | null;
}) {
  const { user } = useAuth();
  const [envios, setEnvios] = useState<WhatsAppEnvio[]>([]);
  const podeListarWhatsApp = hasPermission(user, 'whatsapp.listar');

  useEffect(() => {
    if (!podeListarWhatsApp) return;
    whatsappService
      .listar({ page: 0, size: 5, sort: 'dataSolicitacao,desc' })
      .then((res) => setEnvios(res.data.content ?? []))
      .catch(() => setEnvios([]));
  }, [podeListarWhatsApp]);

  const celebracoes = useMemo(() => {
    const lista: DashboardCelebracaoResumo[] = [];
    if (dashboard?.proximaCelebracao) lista.push(dashboard.proximaCelebracao);
    lista.push(...(dashboard?.proximasCelebracoes ?? []));
    return lista;
  }, [dashboard]);

  const publicadas = celebracoes.filter((item) => item.escalaPublicada).length;
  const rascunho = celebracoes.length - publicadas;
  const pendencias = [
    {
      href: '/repertorios',
      rotulo: 'Repertórios incompletos',
      valor: dashboard?.repertoriosIncompletos ?? 0,
      tom: 'aviso' as const,
    },
    {
      href: '/escalas',
      rotulo: 'Músicos sem confirmação',
      valor: dashboard?.confirmacoesPendentes ?? 0,
      tom: 'info' as const,
    },
    {
      href: '/whatsapp',
      rotulo: 'Envios com erro',
      valor: dashboard?.whatsappErros ?? 0,
      tom: 'ok' as const,
    },
  ];

  return (
    <section className={styles.dash}>
      <div className={styles.dashTopo}>
        <div>
          <h1 className={styles.saudacao}>Olá, {primeiroNome(nome, 'coordenador')}! 👋</h1>
          <p className={styles.subtitulo}>Resumo das próximas celebrações e da comunicação com o ministério.</p>
        </div>
        <div className={styles.dashAcoes}>
          <p className={styles.competencia}>{competenciaAtual()}</p>
          <PermissionGate permission="celebracao.criar">
            <Link href="/celebracoes" className={styles.botaoPrimario}>
              <Plus size={18} strokeWidth={2.2} />
              Nova Celebração
            </Link>
          </PermissionGate>
        </div>
      </div>

      <div className={styles.kpis}>
        <Link href="/escalas" className={styles.kpi}>
          <span className={styles.kpiIcone}>
            <Users size={18} />
          </span>
          <span className={styles.kpiValor}>{dashboard?.musicosEscaladosProxima ?? 0}</span>
          <span className={styles.kpiRotulo}>Músicos na próxima escala</span>
          <span className={styles.kpiLink}>Ver escalas</span>
        </Link>
        <Link href="/celebracoes" className={styles.kpi}>
          <span className={styles.kpiIcone}>
            <CalendarDays size={18} />
          </span>
          <span className={styles.kpiValor}>{celebracoes.length}</span>
          <span className={styles.kpiRotulo}>Celebrações no período</span>
          <span className={styles.kpiLink}>Ver calendário</span>
        </Link>
        <Link href="/escalas" className={styles.kpi}>
          <span className={styles.kpiIcone}>
            <ListMusic size={18} />
          </span>
          <span className={styles.kpiValor}>{publicadas}</span>
          <span className={styles.kpiRotulo}>Escalas publicadas</span>
          <span className={styles.kpiLink}>Ver escalas</span>
        </Link>
        <Link href="/whatsapp" className={styles.kpi}>
          <span className={styles.kpiIcone}>
            <MessageCircle size={18} />
          </span>
          <span className={styles.kpiValor}>{dashboard?.whatsappPendentes ?? 0}</span>
          <span className={styles.kpiRotulo}>WhatsApps pendentes</span>
          <span className={styles.kpiLink}>Ver envios</span>
        </Link>
      </div>

      <div className={styles.gradeMedia}>
        <article className={styles.painel}>
          <h2 className={styles.painelTitulo}>Próximas celebrações</h2>
          {celebracoes.length === 0 ? (
            <p className={styles.vazio}>Nenhuma celebração futura no período.</p>
          ) : (
            <ul className={styles.listaCelebracoes}>
              {celebracoes.map((item) => {
                const caixa = caixaData(item.data);
                const musicos =
                  item.quantidadeMusicos === 1 ? '1 músico' : `${item.quantidadeMusicos} músicos`;
                return (
                  <li key={item.celebracaoCodigo}>
                    <Link href={hrefCelebracao(item)} className={styles.linhaCelebracao}>
                      <span className={styles.dataCaixa}>
                        <strong>{caixa.dia}</strong>
                        {caixa.mes}
                      </span>
                      <span className={styles.linhaCorpo}>
                        <span className={styles.linhaTitulo}>{item.titulo}</span>
                        <span className={styles.linhaMeta}>
                          {formatarHoraHhMm(item.horaInicio)}
                          {item.localNome ? ` · ${item.localNome}` : ''}
                        </span>
                      </span>
                      <span className={styles.linhaBadges}>
                        <span className={styles.pillNeutro}>{musicos}</span>
                        <span className={item.escalaPublicada ? styles.pillOk : styles.pillAviso}>
                          {item.escalaPublicada ? 'Publicado' : 'Rascunho'}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className={styles.painel}>
          <h2 className={styles.painelTitulo}>Escalas por status</h2>
          <DonutEscalas publicadas={publicadas} rascunho={rascunho} />
        </article>

        <article className={styles.painel} id="pendencias">
          <h2 className={styles.painelTitulo}>Pendências</h2>
          <ul className={styles.listaPendencias}>
            {pendencias.map((item) => (
              <li key={item.rotulo}>
                <Link href={item.href} className={styles.linhaPendencia}>
                  <span>{item.rotulo}</span>
                  <span className={`${styles.pendenciaValor} ${styles[`pendencia_${item.tom}`]}`}>
                    {item.valor}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {podeListarWhatsApp && (
        <article className={styles.painel}>
          <div className={styles.painelCabecalho}>
            <h2 className={styles.painelTitulo}>Últimos envios via WhatsApp</h2>
            <Link href="/whatsapp" className={styles.kpiLink}>
              Ver envios
            </Link>
          </div>
          {envios.length === 0 ? (
            <p className={styles.vazio}>Nenhum envio recente.</p>
          ) : (
            <div className={styles.tabelaWrap}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th>Músico</th>
                    <th>Status</th>
                    <th>Enviado em</th>
                  </tr>
                </thead>
                <tbody>
                  {envios.map((envio) => (
                    <tr key={envio.codigo}>
                      <td>
                        <span className={styles.envioMusico}>
                          <span className={styles.envioAvatar} aria-hidden>
                            {(envio.musicoNome ?? envio.telefone).charAt(0).toUpperCase()}
                          </span>
                          {envio.musicoNome ?? envio.telefone}
                        </span>
                      </td>
                      <td>
                        <span className={classeStatusEnvio(envio.status)}>{rotuloStatusEnvio(envio.status)}</span>
                      </td>
                      <td>{formatarDataHora(envio.dataEnvio ?? envio.dataSolicitacao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
