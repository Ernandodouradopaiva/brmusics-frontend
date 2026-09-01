'use client';

import { X } from 'lucide-react';

interface ModalCloseButtonProps {
  onClose: () => void;
  disabled?: boolean;
}

export function ModalCloseButton({ onClose, disabled = false }: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      className="modalGlobalCloseBtn"
      onClick={onClose}
      disabled={disabled}
      aria-label="Fechar"
      title="Fechar"
      data-modal-close
    >
      <X size={18} strokeWidth={2} aria-hidden />
    </button>
  );
}
