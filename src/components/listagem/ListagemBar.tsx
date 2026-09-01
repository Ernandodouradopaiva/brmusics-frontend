'use client';

import { Search } from 'lucide-react';
import styles from './listagem.module.css';

interface ListagemBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFiltros?: () => void;
  onLimparFiltros?: () => void;
  onCadastrar?: () => void;
  labelCadastrar?: string;
  children?: React.ReactNode;
}

export function ListagemBar({
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  onFiltros,
  onLimparFiltros,
  onCadastrar,
  labelCadastrar = 'Cadastrar',
  children,
}: ListagemBarProps) {
  const showSearch = searchPlaceholder != null && onSearchChange != null;

  return (
    <div className={styles.bar}>
      {showSearch && (
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar"
            data-search-input
          />
          <Search size={18} className={styles.searchIcon} aria-hidden />
        </div>
      )}
      {children}
      <div className={styles.actions}>
        {onFiltros && (
          <button type="button" onClick={onFiltros} className={styles.btnFiltros}>
            Filtros
          </button>
        )}
        {onLimparFiltros && (
          <button type="button" onClick={onLimparFiltros} className={styles.btnLimpar}>
            Limpar Filtros
          </button>
        )}
        {onCadastrar && (
          <button type="button" onClick={onCadastrar} className={styles.btnCadastrar}>
            {labelCadastrar}
          </button>
        )}
      </div>
    </div>
  );
}
