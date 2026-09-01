'use client';

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  label?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingSpinner({
  label = 'Carregando...',
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={[styles.wrap, fullPage ? styles.fullPage : '', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.spinner} aria-hidden />
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  );
}
