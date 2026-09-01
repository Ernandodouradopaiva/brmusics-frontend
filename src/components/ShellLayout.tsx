'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from './DashboardHeader';
import { Sidebar } from './Sidebar';
import { MusicoBottomNav } from './MusicoBottomNav';
import { RouteAccessGuard } from './RouteAccessGuard';
import { isPublicAppRoute } from '@/lib/public-routes';
import { usuarioUsaNavegacaoMusico } from '@/lib/permissions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import styles from '@/app/dashboard/dashboard.module.css';

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;
const DESKTOP_BREAKPOINT = 1024;

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const isPublic = isPublicAppRoute(pathname);
  const navMusico = usuarioUsaNavegacaoMusico(user);
  const sidebarMusicoMobile = navMusico && !isDesktop;

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const applyBreakpoint = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (!desktop) {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      }
    };
    applyBreakpoint();
    mq.addEventListener('change', applyBreakpoint);
    return () => mq.removeEventListener('change', applyBreakpoint);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublic) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, isPublic, router]);

  const sidebarWidth = isDesktop
    ? sidebarCollapsed
      ? SIDEBAR_WIDTH_COLLAPSED
      : SIDEBAR_WIDTH_EXPANDED
    : 0;

  const openMobileSidebar = () => {
    setSidebarOpen(true);
    setSidebarCollapsed(false);
  };

  if (loading) {
    return <LoadingSpinner fullPage label="Carregando..." />;
  }

  if (isPublic || !isAuthenticated) {
    return <>{children}</>;
  }

  const onHeaderMenuClick = () => {
    if (isDesktop) {
      setSidebarCollapsed((c) => !c);
      return;
    }
    if (sidebarOpen) {
      setSidebarOpen(false);
      return;
    }
    openMobileSidebar();
  };

  return (
    <div className={styles.shellLayout}>
      <div className={styles.shellBody}>
        {!sidebarMusicoMobile && (
          <>
            <div
              className={`${styles.sidebarOverlay} ${sidebarOpen && !isDesktop ? styles.sidebarOverlayVisible : ''}`}
              aria-hidden={!sidebarOpen || isDesktop}
              onClick={() => setSidebarOpen(false)}
            />
            <Sidebar
              isOpen={isDesktop || sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              collapsed={isDesktop && sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />
          </>
        )}
        <div
          className={styles.shellColumn}
          style={{ marginLeft: sidebarMusicoMobile ? 0 : sidebarWidth }}
        >
          <DashboardHeader
            showMenuButton={!sidebarMusicoMobile}
            onMenuClick={onHeaderMenuClick}
          />
          <main
            className={`${styles.dashboardMain} ${sidebarMusicoMobile ? styles.dashboardMainMusicoMobile : ''}`}
          >
            <RouteAccessGuard>{children}</RouteAccessGuard>
          </main>
        </div>
        {sidebarMusicoMobile && <MusicoBottomNav />}
      </div>
    </div>
  );
}
