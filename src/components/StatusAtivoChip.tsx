import styles from './StatusBadge.module.css';

export function StatusAtivoChip({ ativo }: { ativo?: boolean | null }) {
  const isAtivo = Boolean(ativo);
  return (
    <span className={styles.badge} data-variant={isAtivo ? 'ativo' : 'inativo'}>
      {isAtivo ? 'Ativo' : 'Inativo'}
    </span>
  );
}
