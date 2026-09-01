'use client';

import styles from './listagem.module.css';

export interface ListagemSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label': string;
  id?: string;
}

export function ListagemSwitch({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
  id,
}: ListagemSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-checked={checked}
      className={styles.switchTrack}
      disabled={disabled}
      id={id}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}
