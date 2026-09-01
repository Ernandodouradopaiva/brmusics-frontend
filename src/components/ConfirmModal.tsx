'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ModalCloseButton } from '@/components/ModalCloseButton';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'neutral';
  children?: ReactNode;
}

export function ConfirmModal({
  open,
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmLoading = false,
  onConfirm,
  onCancel,
  variant = 'neutral',
  children,
}: ConfirmModalProps) {
  const abriuEmRef = useRef(0);

  useEffect(() => {
    if (open) abriuEmRef.current = performance.now();
  }, [open]);

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalContent" onClick={(e) => e.stopPropagation()} style={{ maxWidth: children ? 480 : 420 }}>
        <ModalCloseButton onClose={onCancel} disabled={confirmLoading} />
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600, paddingRight: '2.5rem' }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{message}</p>
        {children}
        <div className="modalActions">
          <button type="button" className="modalBtnSecondary" onClick={onCancel} disabled={confirmLoading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="modalBtnPrimary"
            onClick={onConfirm}
            disabled={confirmLoading}
            style={variant === 'danger' ? { background: '#b91c1c' } : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
