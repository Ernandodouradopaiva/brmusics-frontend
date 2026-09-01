'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Guitar,
  Music2,
  Settings,
  Users,
} from 'lucide-react';
import styles from '../login.module.css';

function WhatsAppIcon({ size = 28, strokeWidth = 1.6 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.5a8.5 8.5 0 0 1-12.7 7.4L4 20l1.2-3.2A8.5 8.5 0 1 1 20 11.5Z" />
      <path d="M9.4 8.8c.2-.4.3-.4.6-.4h.5c.2 0 .3.1.4.4l.7 1.7c.1.2 0 .4-.1.5l-.4.5c-.1.1-.1.3 0 .4.4.7 1 1.3 1.7 1.7.2.1.3.1.4 0l.5-.4c.2-.1.4-.2.5-.1l1.7.7c.3.1.4.2.4.4v.5c0 .3 0 .4-.4.6A4.6 4.6 0 0 1 12 16.2 4.6 4.6 0 0 1 9.4 8.8Z" />
    </svg>
  );
}

const MODULOS: {
  titulo: string;
  descricao: string;
  Icone: LucideIcon | typeof WhatsAppIcon;
}[] = [
  {
    titulo: 'Músicos',
    descricao: 'Cadastre e gerencie os músicos do seu ministério.',
    Icone: Users,
  },
  {
    titulo: 'Instrumentos e Funções',
    descricao: 'Defina instrumentos e funções de cada músico.',
    Icone: Guitar,
  },
  {
    titulo: 'Escalas',
    descricao: 'Monte escalas mensais de forma rápida e intuitiva.',
    Icone: CalendarCheck,
  },
  {
    titulo: 'Celebrações',
    descricao: 'Organize missas e celebrações com facilidade.',
    Icone: CalendarDays,
  },
  {
    titulo: 'Repertórios',
    descricao: 'Monte repertórios com músicas por momento litúrgico.',
    Icone: Music2,
  },
  {
    titulo: 'WhatsApp',
    descricao: 'Envie escalas e repertórios para os músicos.',
    Icone: WhatsAppIcon,
  },
  {
    titulo: 'Relatórios',
    descricao: 'Acompanhe tudo com relatórios e histórico completo.',
    Icone: BarChart3,
  },
  {
    titulo: 'Configurações',
    descricao: 'Personalize seu ministério do seu jeito.',
    Icone: Settings,
  },
];

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <h2 className={styles.footerHeading}>
        Tudo que você precisa para organizar seu ministério de música
      </h2>
      <ul className={styles.footerCards}>
        {MODULOS.map(({ titulo, descricao, Icone }) => (
          <li key={titulo} className={styles.footerCard}>
            <span className={styles.footerCardIcon} aria-hidden>
              <Icone size={28} strokeWidth={1.6} />
            </span>
            <strong className={styles.footerCardTitle}>{titulo}</strong>
            <p className={styles.footerCardText}>{descricao}</p>
          </li>
        ))}
      </ul>
    </footer>
  );
}
