'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { Music } from 'lucide-react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import styles from '../login.module.css';

interface PublicBrandShellProps {
  children: ReactNode;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export default function PublicBrandShell({
  children,
  fontSize,
  onFontSizeChange,
}: PublicBrandShellProps) {
  return (
    <div className={styles.loginPage} style={{ fontSize: `${fontSize}rem` }}>
      <PublicHeader fontSize={fontSize} onFontSizeChange={onFontSizeChange} />

      <main className={styles.splitMain}>
        <section className={styles.hero} aria-label="BRMusic">
          <Image
            src="/login-hero.png"
            alt=""
            fill
            priority
            unoptimized
            className={styles.heroImg}
            sizes="(max-width: 900px) 100vw, 60vw"
          />
          <div className={styles.heroScrim} />
          <div className={styles.heroCopy}>
            <div className={styles.heroNote} aria-hidden>
              <Music size={78} strokeWidth={1.4} />
            </div>
            <h1 className={styles.heroTitle}>BRMusic</h1>
            <p className={styles.heroSubtitle}>Sistema de Gestão para Músicos</p>
            <span className={styles.heroCross} aria-hidden>
              <svg viewBox="0 0 24 32" width="16" height="22" fill="currentColor">
                <rect x="10" y="0" width="4" height="32" rx="1" />
                <rect x="4" y="8" width="16" height="4" rx="1" />
              </svg>
            </span>
            <p className={styles.heroTagline}>
              Organize escalas, monte repertórios e mantenha seu ministério sempre em{' '}
              <em className={styles.harmonia}>harmonia</em>.
            </p>
          </div>
        </section>

        <section className={styles.formPane}>{children}</section>
      </main>

      <PublicFooter />
    </div>
  );
}
