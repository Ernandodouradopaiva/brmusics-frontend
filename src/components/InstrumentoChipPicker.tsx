'use client';

import { useMemo, useState } from 'react';
import styles from './InstrumentoChipPicker.module.css';

export type InstrumentoOpcao = {
  codigo: string;
  nome: string;
  ativo?: boolean | null;
};

export function InstrumentoChips({
  instrumentos,
  emptyLabel = '—',
}: {
  instrumentos?: { codigo?: string; nome?: string | null }[] | null;
  emptyLabel?: string;
}) {
  if (!instrumentos?.length) {
    return <span className={styles.empty}>{emptyLabel}</span>;
  }
  return (
    <div className={styles.chipRow} aria-label="Instrumentos">
      {instrumentos.map((item) => (
        <span key={item.codigo ?? item.nome ?? Math.random().toString()} className={styles.chipReadonly}>
          {item.nome || '—'}
        </span>
      ))}
    </div>
  );
}

export function InstrumentoChipPicker({
  opcoes,
  selecionados,
  onChange,
  disabled = false,
  buscaPlaceholder = 'Buscar instrumento ou função',
}: {
  opcoes: InstrumentoOpcao[];
  selecionados: string[];
  onChange: (codigos: string[]) => void;
  disabled?: boolean;
  buscaPlaceholder?: string;
}) {
  const [busca, setBusca] = useState('');
  const selecionadosSet = useMemo(() => new Set(selecionados), [selecionados]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtradas = termo
      ? opcoes.filter((o) => (o.nome ?? '').toLowerCase().includes(termo))
      : opcoes;
    return [...filtradas].sort((a, b) => {
      const aSel = selecionadosSet.has(a.codigo) ? 0 : 1;
      const bSel = selecionadosSet.has(b.codigo) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR');
    });
  }, [opcoes, busca, selecionadosSet]);

  const alternar = (codigo: string) => {
    if (disabled) return;
    if (selecionadosSet.has(codigo)) {
      onChange(selecionados.filter((c) => c !== codigo));
      return;
    }
    onChange([...selecionados, codigo]);
  };

  return (
    <div className={styles.picker}>
      <input
        type="search"
        className={styles.search}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder={buscaPlaceholder}
        aria-label={buscaPlaceholder}
        disabled={disabled}
      />
      {visiveis.length === 0 ? (
        <p className={styles.empty}>Nenhum instrumento encontrado.</p>
      ) : (
        <div className={styles.chipRow} role="group" aria-label="Seleção de instrumentos">
          {visiveis.map((opcao) => {
            const marcado = selecionadosSet.has(opcao.codigo);
            return (
              <button
                key={opcao.codigo}
                type="button"
                role="checkbox"
                aria-checked={marcado}
                disabled={disabled}
                className={`${styles.chip} ${marcado ? styles.chipOn : ''}`}
                onClick={() => alternar(opcao.codigo)}
              >
                {opcao.nome}
                {opcao.ativo === false ? ' (inativo)' : ''}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
