'use client';

import { Moon, Music } from 'lucide-react';
import styles from '../login.module.css';

interface PublicHeaderProps {
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
}

export default function PublicHeader({ fontSize = 1, onFontSizeChange }: PublicHeaderProps) {
  return (
    <header className={styles.topHeader} style={{ fontSize: `${fontSize}rem` }}>
      <span className={styles.headerLeft}>
        <Music size={20} strokeWidth={2} aria-hidden className={styles.headerNote} />
        <span className={styles.headerBrandFull}>BRMusic | Sistema de Gestão para Músicos</span>
        <span className={styles.headerBrandShort}>BRMusic</span>
      </span>
      <div className={styles.headerRight}>
        <span className={styles.acessibilidade}>Acessibilidade</span>
        <button
          type="button"
          className={styles.fontBtn}
          onClick={() => onFontSizeChange?.(Math.max(0.9, fontSize - 0.1))}
          title="Diminuir fonte"
        >
          A-
        </button>
        <button
          type="button"
          className={styles.fontBtn}
          onClick={() => onFontSizeChange?.(1)}
          title="Fonte normal"
        >
          A
        </button>
        <button
          type="button"
          className={styles.fontBtn}
          onClick={() => onFontSizeChange?.(Math.min(1.2, fontSize + 0.1))}
          title="Aumentar fonte"
        >
          A+
        </button>
        <button
          type="button"
          className={styles.darkModeBtn}
          title="Modo escuro"
          aria-label="Alternar modo escuro"
        >
          <Moon size={18} />
        </button>
      </div>
    </header>
  );
}
