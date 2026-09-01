'use client';

import type { ReactNode } from 'react';
import { KeyRound, Pencil } from 'lucide-react';
import styles from './listagem.module.css';

export interface Coluna<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'right';
}

export interface AcaoExtra<T> {
  label: string;
  onClick: (item: T) => void;
  icon?: ReactNode;
  visible?: (item: T) => boolean;
}

interface ListagemTableProps<T> {
  colunas: Coluna<T>[];
  dados: T[];
  rowKey: (item: T) => string;
  onEditar?: (item: T) => void;
  labelEditar?: string;
  onExcluir?: (item: T) => void;
  acoesExtra?: AcaoExtra<T>[];
  emptyMessage?: string;
}

function valorCelula<T extends object>(item: T, col: Coluna<T>): ReactNode {
  if (col.render) return col.render(item);
  const bruto = (item as Record<string, unknown>)[col.key];
  return bruto == null || bruto === '' ? '—' : String(bruto);
}

export function ListagemTable<T extends object>({
  colunas,
  dados,
  rowKey,
  onEditar,
  labelEditar = 'Editar',
  onExcluir,
  acoesExtra,
  emptyMessage = 'Nenhum registro encontrado.',
}: ListagemTableProps<T>) {
  const hasActions = Boolean(onEditar || onExcluir || (acoesExtra && acoesExtra.length > 0));

  if (dados.length === 0) {
    return <p className="emptyState">{emptyMessage}</p>;
  }

  const acoes = (item: T) => (
    <>
      {onEditar && (
        <button type="button" onClick={() => onEditar(item)} className={styles.btnEditar}>
          <Pencil size={14} />
          {labelEditar}
        </button>
      )}
      {acoesExtra?.map((acao, idx) => {
        if (acao.visible && !acao.visible(item)) return null;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => acao.onClick(item)}
            className={styles.btnAcaoExtra}
          >
            {acao.icon ?? <KeyRound size={14} />}
            {acao.label}
          </button>
        );
      })}
      {onExcluir && (
        <button type="button" onClick={() => onExcluir(item)} className={styles.btnExcluir}>
          Excluir
        </button>
      )}
    </>
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.key} style={{ textAlign: c.align ?? 'left' }}>
                {c.label}
              </th>
            ))}
            {hasActions && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={rowKey(item)}>
              {colunas.map((col) => (
                <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                  {valorCelula(item, col)}
                </td>
              ))}
              {hasActions && <td className={styles.acoesCelula}>{acoes(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.cardsMobile}>
        {dados.map((item) => (
          <article key={rowKey(item)} className={styles.card}>
            {colunas.map((col) => (
              <div key={col.key} className={styles.cardCampo}>
                <span className={styles.cardLabel}>{col.label}</span>
                <span className={styles.cardValor}>{valorCelula(item, col)}</span>
              </div>
            ))}
            {hasActions && <div className={styles.cardAcoes}>{acoes(item)}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}
