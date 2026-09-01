'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AudioLines,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  KeyRound,
  Library,
  ListMusic,
  MapPin,
  MessageCircle,
  Music,
  Music2,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  podeVerMenuCelebracoes,
  podeVerMenuEscalas,
  podeVerMenuInstrumentos,
  podeVerMenuLocais,
  podeVerMenuMeuRepertorio,
  podeVerMenuMinhaEscala,
  podeVerMenuMusicas,
  podeVerMenuMusicos,
  podeVerMenuRelatorios,
  podeVerMenuRepertorios,
  podeVerMenuWhatsApp,
  userCanSeeMenuHref,
  usuarioPodeVerMenuInicio,
  usuarioUsaNavegacaoMusico,
} from '@/lib/permissions';
import styles from '@/app/dashboard/dashboard.module.css';

type NavItem = {
  href: string;
  label: string;
  icon: ElementType;
  visible: boolean;
};

function itemAtivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  onClose,
}: {
  href: string;
  label: string;
  icon: ElementType;
  pathname: string;
  onClose: () => void;
}) {
  const active = itemAtivo(pathname, href);
  return (
    <Link
      href={href}
      className={`${styles.sidebarIconLink} ${active ? styles.sidebarIconLinkActive : ''}`}
      onClick={onClose}
      title={label}
    >
      <Icon size={20} strokeWidth={1.75} />
      <span className={styles.sidebarLabel}>{label}</span>
    </Link>
  );
}

function NavGroup({
  titulo,
  itens,
  collapsed,
  pathname,
  onClose,
}: {
  titulo: string;
  itens: NavItem[];
  collapsed: boolean;
  pathname: string;
  onClose: () => void;
}) {
  const visiveis = itens.filter((item) => item.visible);
  if (visiveis.length === 0) return null;
  return (
    <div className={styles.sidebarGroup}>
      {!collapsed && <p className={styles.sidebarGroupTitle}>{titulo}</p>}
      {visiveis.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          pathname={pathname}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navMusico = usuarioUsaNavegacaoMusico(user);

  const minhaArea: NavItem[] = [
    {
      href: '/minha-escala',
      label: 'Minha escala',
      icon: ListMusic,
      visible: podeVerMenuMinhaEscala(user),
    },
    {
      href: '/meu-repertorio',
      label: 'Meu repertório',
      icon: Music2,
      visible: podeVerMenuMeuRepertorio(user),
    },
    {
      href: '/perfil',
      label: 'Perfil',
      icon: User,
      visible: navMusico,
    },
  ];

  const gestao: NavItem[] = [
    { href: '/musicos', label: 'Músicos', icon: Music, visible: podeVerMenuMusicos(user) },
    {
      href: '/instrumentos',
      label: 'Instrumentos / Funções',
      icon: AudioLines,
      visible: podeVerMenuInstrumentos(user),
    },
    { href: '/locais', label: 'Locais', icon: MapPin, visible: podeVerMenuLocais(user) },
    {
      href: '/celebracoes',
      label: 'Celebrações',
      icon: CalendarDays,
      visible: podeVerMenuCelebracoes(user),
    },
    { href: '/escalas', label: 'Escalas', icon: ListMusic, visible: podeVerMenuEscalas(user) },
    {
      href: '/repertorios',
      label: 'Repertórios',
      icon: Music2,
      visible: podeVerMenuRepertorios(user),
    },
    { href: '/musicas', label: 'Músicas', icon: Library, visible: podeVerMenuMusicas(user) },
    {
      href: '/relatorios',
      label: 'Relatórios',
      icon: FileText,
      visible: podeVerMenuRelatorios(user),
    },
  ];

  const comunicacao: NavItem[] = [
    {
      href: '/whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      visible: podeVerMenuWhatsApp(user),
    },
  ];

  const configuracoes: NavItem[] = [
    { href: '/usuarios', label: 'Usuários', icon: Users, visible: userCanSeeMenuHref(user, '/usuarios') },
    { href: '/grupos', label: 'Grupos', icon: Shield, visible: userCanSeeMenuHref(user, '/grupos') },
    {
      href: '/permissoes',
      label: 'Permissões',
      icon: KeyRound,
      visible: userCanSeeMenuHref(user, '/permissoes'),
    },
  ];

  return (
    <aside
      className={`${styles.dashboardSidebar} ${isOpen ? styles.dashboardSidebarOpen : ''} ${
        collapsed ? styles.dashboardSidebarCollapsed : ''
      }`}
    >
      <Link href="/home" className={styles.sidebarBrand} onClick={onClose} title="BRMusics">
        <span className={styles.sidebarBrandIcon} aria-hidden>
          <Music2 size={22} strokeWidth={1.75} />
        </span>
        <span className={styles.sidebarBrandText}>
          <strong>BRMusics</strong>
          <span>Sistema de Gestão para Músicos</span>
        </span>
      </Link>

      <nav className={styles.sidebarNav}>
        {(usuarioPodeVerMenuInicio(user) || podeVerMenuMinhaEscala(user)) && (
          <NavLink
            href="/home"
            label={navMusico ? 'Início' : 'Dashboard'}
            icon={Home}
            pathname={pathname}
            onClose={onClose}
          />
        )}
        <NavGroup
          titulo="Minha área"
          itens={minhaArea}
          collapsed={collapsed}
          pathname={pathname}
          onClose={onClose}
        />
        <NavGroup titulo="Gestão" itens={gestao} collapsed={collapsed} pathname={pathname} onClose={onClose} />
        <NavGroup
          titulo="Comunicação"
          itens={comunicacao}
          collapsed={collapsed}
          pathname={pathname}
          onClose={onClose}
        />
        <NavGroup
          titulo="Configurações"
          itens={configuracoes}
          collapsed={collapsed}
          pathname={pathname}
          onClose={onClose}
        />
      </nav>
      <div className={styles.sidebarCollapseFooter}>
        <button
          type="button"
          className={styles.sidebarCollapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Recolher menu</span>}
        </button>
      </div>
    </aside>
  );
}
