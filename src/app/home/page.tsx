'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CardEscalaResumo, CardProximaEscala, SaudacaoMusico } from '@/components/musico/MusicoEscalaCards';
import { DashboardCoordenador } from '@/components/coordenador/DashboardCoordenador';
import { minhaEscalaService } from '@/services/minhaEscala';
import { inicioService } from '@/services/inicio';
import { notifyApiError } from '@/lib/notify';
import { hasPermission, usuarioUsaNavegacaoMusico } from '@/lib/permissions';
import type { DashboardCoordenador as DashboardCoordenadorModel, MinhaEscalaAgenda } from '@/types/api';
import styles from '@/app/musico/musico.module.css';
import dash from '@/app/dashboard/dashboard.module.css';
import home from '@/app/home/home.module.css';
import Link from 'next/link';
import {
  ClipboardCheck,
  Users,
  Shield,
  KeyRound,
  FileText,
  Music,
  AudioLines,
  MapPin,
  CalendarDays,
  ListMusic,
  Library,
  Music2,
  MessageCircle,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const mostrarAreaMusico = usuarioUsaNavegacaoMusico(user);
  const [agenda, setAgenda] = useState<MinhaEscalaAgenda | null>(null);
  const [dashboard, setDashboard] = useState<DashboardCoordenadorModel | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    if (mostrarAreaMusico) {
      minhaEscalaService
        .agenda()
        .then((res) => {
          if (ativo) setAgenda(res.data);
        })
        .catch((err) => {
          if (ativo) setAgenda(null);
          notifyApiError(err);
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
      return () => {
        ativo = false;
      };
    }

    if (!hasPermission(user, 'inicio.listar')) {
      setDashboard(null);
      setCarregando(false);
      return;
    }

    inicioService
      .dashboard()
      .then((res) => {
        if (ativo) setDashboard(res.data);
      })
      .catch((err) => {
        if (ativo) setDashboard(null);
        notifyApiError(err);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [mostrarAreaMusico, user]);

  return (
    <div className={mostrarAreaMusico ? undefined : home.page}>
      {mostrarAreaMusico && (
        <section>
          {carregando ? (
            <LoadingSpinner label="Carregando sua escala..." />
          ) : (
            <>
              <SaudacaoMusico nome={agenda?.nomeMusico || user?.nome} />
              <p className={styles.secaoTitulo}>Sua próxima escala</p>
              {agenda?.proxima ? (
                <CardProximaEscala item={agenda.proxima} />
              ) : (
                <p className={styles.vazio}>Nenhuma escala futura cadastrada para você.</p>
              )}
              <p className={styles.secaoTitulo}>Próximas escalas</p>
              {(agenda?.proximas ?? []).length > 0 ? (
                <div className={styles.lista}>
                  {agenda?.proximas.map((item) => (
                    <CardEscalaResumo key={item.escalaCodigo} item={item} />
                  ))}
                </div>
              ) : (
                <p className={styles.vazio}>Não há outras escalas futuras.</p>
              )}
              <p className={styles.secaoTitulo}>Histórico</p>
              {(agenda?.historico ?? []).length > 0 ? (
                <div className={styles.lista}>
                  {agenda?.historico.slice(0, 5).map((item) => (
                    <CardEscalaResumo key={item.escalaCodigo} item={item} />
                  ))}
                </div>
              ) : (
                <p className={styles.vazio}>Ainda não há escalas anteriores.</p>
              )}
            </>
          )}
        </section>
      )}

      {!mostrarAreaMusico &&
        (carregando ? (
          <LoadingSpinner label="Carregando o painel..." />
        ) : (
          <DashboardCoordenador nome={user?.nome} dashboard={dashboard} />
        ))}

      {mostrarAreaMusico && (
      <PermissionGate
        anyOf={[
          'musico.pagina',
          'frequencia.pagina',
          'instrumento.pagina',
          'musica.pagina',
          'local.pagina',
          'celebracao.pagina',
          'escala.pagina',
          'repertorio.pagina',
          'whatsapp.pagina',
          'usuario.pagina',
          'grupo.pagina',
          'permissao.pagina',
          'relatorio.pagina',
        ]}
      >
        <div className={mostrarAreaMusico ? undefined : home.atalhos}>
          <h2 className={dash.sectionTitle}>{mostrarAreaMusico ? 'Administração' : 'Acesso rápido'}</h2>
          <p className={dash.sectionSubtitle}>Escolha uma área para gerenciar</p>
          <div className={dash.cardsGrid}>
            <PermissionGate permission="musico.pagina">
              <Link href="/musicos" className={dash.accessCard}>
                <Music size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Músicos
              </Link>
            </PermissionGate>
            <PermissionGate permission="frequencia.pagina">
              <Link href="/frequencias" className={dash.accessCard}>
                <ClipboardCheck size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Frequência
              </Link>
            </PermissionGate>
            <PermissionGate permission="instrumento.pagina">
              <Link href="/instrumentos" className={dash.accessCard}>
                <AudioLines size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Instrumentos
              </Link>
            </PermissionGate>
            <PermissionGate permission="musica.pagina">
              <Link href="/musicas" className={dash.accessCard}>
                <Library size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Músicas
              </Link>
            </PermissionGate>
            <PermissionGate permission="local.pagina">
              <Link href="/locais" className={dash.accessCard}>
                <MapPin size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Locais
              </Link>
            </PermissionGate>
            <PermissionGate permission="celebracao.pagina">
              <Link href="/celebracoes" className={dash.accessCard}>
                <CalendarDays size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Celebrações
              </Link>
            </PermissionGate>
            <PermissionGate permission="escala.pagina">
              <Link href="/escalas" className={dash.accessCard}>
                <ListMusic size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Escalas
              </Link>
            </PermissionGate>
            <PermissionGate permission="repertorio.pagina">
              <Link href="/repertorios" className={dash.accessCard}>
                <Music2 size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Repertórios
              </Link>
            </PermissionGate>
            <PermissionGate permission="whatsapp.pagina">
              <Link href="/whatsapp" className={dash.accessCard}>
                <MessageCircle size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                WhatsApp
              </Link>
            </PermissionGate>
            <PermissionGate permission="usuario.pagina">
              <Link href="/usuarios" className={dash.accessCard}>
                <Users size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Usuários
              </Link>
            </PermissionGate>
            <PermissionGate permission="grupo.pagina">
              <Link href="/grupos" className={dash.accessCard}>
                <Shield size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Grupos
              </Link>
            </PermissionGate>
            <PermissionGate permission="permissao.pagina">
              <Link href="/permissoes" className={dash.accessCard}>
                <KeyRound size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Permissões
              </Link>
            </PermissionGate>
            <PermissionGate permission="relatorio.pagina">
              <Link href="/relatorios" className={dash.accessCard}>
                <FileText size={32} className={dash.accessCardIcon} strokeWidth={1.5} />
                Relatórios
              </Link>
            </PermissionGate>
          </div>
        </div>
      </PermissionGate>
      )}
    </div>
  );
}
