'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListMusic, Music2, User } from 'lucide-react';
import styles from '@/app/musico/musico.module.css';

const ITENS = [
  { href: '/home', label: 'Início', icon: Home, match: (p: string) => p === '/home' || p === '/' },
  { href: '/minha-escala', label: 'Escalas', icon: ListMusic, match: (p: string) => p.startsWith('/minha-escala') },
  { href: '/meu-repertorio', label: 'Repertórios', icon: Music2, match: (p: string) => p.startsWith('/meu-repertorio') },
  { href: '/perfil', label: 'Perfil', icon: User, match: (p: string) => p.startsWith('/perfil') },
] as const;

export function MusicoBottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.bottomNav} aria-label="Navegação do músico">
      {ITENS.map((item) => {
        const Icon = item.icon;
        const ativo = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomNavLink} ${ativo ? styles.bottomNavLinkActive : ''}`}
            aria-current={ativo ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
