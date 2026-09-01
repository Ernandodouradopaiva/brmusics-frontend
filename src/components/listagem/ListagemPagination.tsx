'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './listagem.module.css';

const DEFAULT_SIZE_OPTIONS = [5, 10, 20] as const;

export interface ListagemPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  resourceLabel: string;
  sizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export function ListagemPagination({
  page,
  totalPages,
  totalElements,
  size,
  resourceLabel,
  sizeOptions = DEFAULT_SIZE_OPTIONS,
  onPageChange,
  onSizeChange,
}: ListagemPaginationProps) {
  const pages = Math.max(totalPages, 1);
  const current = Math.min(page + 1, pages);

  return (
    <div className={styles.footer}>
      <span className={styles.footerTotal}>
        {totalElements} {resourceLabel} no total
      </span>

      <div className={styles.footerControls}>
        <span className={styles.footerPageOf}>
          Página {current} de {pages}
        </span>

        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.paginationBtn}
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.paginationCurrent}>{current}</span>
          <button
            type="button"
            className={styles.paginationBtn}
            disabled={page >= pages - 1}
            onClick={() => onPageChange(page + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <label className={styles.perPage}>
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            aria-label="Registros por página"
          >
            {sizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / página
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
