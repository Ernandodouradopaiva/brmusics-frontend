'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './FeedbackMessage.module.css';

export type FeedbackVariant = 'error' | 'success' | 'info' | 'warning';

type Props = {
  variant?: FeedbackVariant;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
};

const ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
} as const;

export function FeedbackMessage({
  variant = 'info',
  children,
  onDismiss,
  className,
}: Props) {
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={[styles.card, styles[variant], className].filter(Boolean).join(' ')}
    >
      <Icon className={styles.icon} size={18} strokeWidth={2} aria-hidden />
      <div className={styles.body}>{children}</div>
      {onDismiss ? (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Fechar mensagem">
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
