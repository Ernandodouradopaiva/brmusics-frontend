'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown, KeyRound, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AlterarSenhaModal } from '@/components/AlterarSenhaModal';
import { grupoNomeDoUsuario } from '@/lib/userGrupo';
import { podeVerMenuWhatsApp } from '@/lib/permissions';
import styles from '@/app/dashboard/dashboard.module.css';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function DashboardHeader({ onMenuClick, showMenuButton = false }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [alterarSenhaOpen, setAlterarSenhaOpen] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = user?.nome?.charAt(0)?.toUpperCase() ?? 'U';
  const grupoLabel = grupoNomeDoUsuario(user) || '—';
  const avisosHref = podeVerMenuWhatsApp(user) ? '/whatsapp' : '/home';

  useEffect(() => {
    if (!menuAberto) return;
    const fechar = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [menuAberto]);

  return (
    <header className={styles.dashboardHeader}>
      <div className={styles.headerLeft}>
        {showMenuButton && (
          <button
            type="button"
            className={styles.headerMenuBtn}
            onClick={onMenuClick}
            aria-label="Abrir ou recolher o menu"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
        )}
      </div>
      <div className={styles.headerRight}>
        <Link href={avisosHref} className={styles.headerIconBtn} aria-label="Avisos" title="Avisos">
          <Bell size={20} strokeWidth={1.75} />
        </Link>
        <div className={styles.userMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.userInfoBtn}
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-expanded={menuAberto}
            aria-haspopup="menu"
          >
            <div className={styles.userAvatar} aria-hidden>
              {initial}
            </div>
            <div className={styles.userLabels}>
              <span className={styles.userName}>{user?.nome ?? 'Usuário'}</span>
              <span className={styles.userRole}>{grupoLabel}</span>
            </div>
            <ChevronDown size={16} className={styles.userChevron} aria-hidden />
          </button>
          {menuAberto && (
            <div className={styles.userDropdown} role="menu">
              <button
                type="button"
                role="menuitem"
                className={styles.userDropdownItem}
                onClick={() => {
                  setMenuAberto(false);
                  setAlterarSenhaOpen(true);
                }}
              >
                <KeyRound size={16} />
                Alterar senha
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.userDropdownItem}
                onClick={() => {
                  setMenuAberto(false);
                  void logout();
                }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
      {alterarSenhaOpen && user?.codigo && (
        <AlterarSenhaModal
          codigoUsuario={user.codigo}
          onClose={() => setAlterarSenhaOpen(false)}
        />
      )}
    </header>
  );
}
