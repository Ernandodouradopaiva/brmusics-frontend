'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './DualPicklist.module.css';

export interface DualPicklistOption {
  value: string;
  label: string;
  meta?: string;
  /** Impede adicionar à lista da direita (ex.: sistema inativo). */
  disabled?: boolean;
}

export interface DualPicklistProps {
  options: DualPicklistOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  availableLabel?: string;
  selectedLabel?: string;
}

function ordenar(a: DualPicklistOption, b: DualPicklistOption): number {
  return a.label.localeCompare(b.label, 'pt-BR');
}

function filtrarPorBusca(itens: DualPicklistOption[], busca: string): DualPicklistOption[] {
  const termo = busca.trim().toLowerCase();
  if (!termo) return itens;
  return itens.filter(
    (item) =>
      item.label.toLowerCase().includes(termo) ||
      (item.meta?.toLowerCase().includes(termo) ?? false) ||
      item.value.toLowerCase().includes(termo)
  );
}

export function DualPicklist({
  options,
  selected,
  onChange,
  disabled = false,
  availableLabel = 'Disponíveis',
  selectedLabel = 'Associados',
}: DualPicklistProps) {
  const [buscaDisponiveis, setBuscaDisponiveis] = useState('');
  const [buscaSelecionados, setBuscaSelecionados] = useState('');
  const [destaqueDisponiveis, setDestaqueDisponiveis] = useState<string[]>([]);
  const [destaqueSelecionados, setDestaqueSelecionados] = useState<string[]>([]);

  const selecionadosSet = useMemo(() => new Set(selected), [selected]);

  const disponiveis = useMemo(
    () => options.filter((o) => !selecionadosSet.has(o.value)).sort(ordenar),
    [options, selecionadosSet]
  );

  const associados = useMemo(
    () => options.filter((o) => selecionadosSet.has(o.value)).sort(ordenar),
    [options, selecionadosSet]
  );

  const disponiveisFiltrados = useMemo(
    () => filtrarPorBusca(disponiveis, buscaDisponiveis),
    [disponiveis, buscaDisponiveis]
  );

  const associadosFiltrados = useMemo(
    () => filtrarPorBusca(associados, buscaSelecionados),
    [associados, buscaSelecionados]
  );

  const adicionar = (valores: string[]) => {
    if (valores.length === 0) return;
    const permitidos = new Set(
      disponiveis.filter((o) => !o.disabled).map((o) => o.value)
    );
    const novos = valores.filter((v) => permitidos.has(v));
    if (novos.length === 0) return;
    onChange([...new Set([...selected, ...novos])]);
    setDestaqueDisponiveis([]);
  };

  const remover = (valores: string[]) => {
    if (valores.length === 0) return;
    const removerSet = new Set(valores);
    onChange(selected.filter((v) => !removerSet.has(v)));
    setDestaqueSelecionados([]);
  };

  const toggleDestaque = (lado: 'disponiveis' | 'selecionados', valor: string, itemDisabled: boolean) => {
    if (disabled || itemDisabled) return;
    if (lado === 'disponiveis') {
      setDestaqueDisponiveis((prev) =>
        prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]
      );
    } else {
      setDestaqueSelecionados((prev) =>
        prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]
      );
    }
  };

  const adicionarDestacados = () => adicionar(destaqueDisponiveis);
  const adicionarTodos = () => adicionar(disponiveisFiltrados.filter((o) => !o.disabled).map((o) => o.value));
  const removerDestacados = () => remover(destaqueSelecionados);
  const removerTodos = () => remover(associadosFiltrados.map((o) => o.value));

  const renderLista = (
    itens: DualPicklistOption[],
    lado: 'disponiveis' | 'selecionados',
    destaque: string[],
    vazio: string
  ) => {
    if (itens.length === 0) {
      return <p className={styles.empty}>{vazio}</p>;
    }

    return (
      <ul className={styles.list} role="listbox" aria-multiselectable="true">
        {itens.map((item) => {
          const itemDisabled = disabled || (lado === 'disponiveis' && Boolean(item.disabled));
          const highlighted = destaque.includes(item.value);
          return (
            <li
              key={item.value}
              role="option"
              aria-selected={highlighted}
              className={`${styles.item} ${highlighted ? styles.itemHighlighted : ''} ${
                itemDisabled ? styles.itemDisabled : ''
              }`}
              onClick={() => toggleDestaque(lado, item.value, itemDisabled)}
              onDoubleClick={() => {
                if (itemDisabled) return;
                if (lado === 'disponiveis') adicionar([item.value]);
                else remover([item.value]);
              }}
            >
              <span className={styles.itemLabel}>{item.label}</span>
              {item.meta ? <span className={styles.itemMeta}>{item.meta}</span> : null}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={styles.dualPicklist}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>{availableLabel}</p>
        <input
          type="text"
          className={styles.search}
          data-search-input
          placeholder="Pesquisar..."
          value={buscaDisponiveis}
          onChange={(e) => setBuscaDisponiveis(e.target.value)}
          disabled={disabled}
          aria-label="Pesquisar sistemas disponíveis"
        />
        {renderLista(
          disponiveisFiltrados,
          'disponiveis',
          destaqueDisponiveis,
          'Nenhum sistema disponível.'
        )}
        <span className={styles.count}>{disponiveis.length} disponível(is)</span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={adicionarDestacados}
          disabled={disabled || destaqueDisponiveis.length === 0}
          aria-label="Associar selecionados"
          title="Associar selecionados"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={adicionarTodos}
          disabled={
            disabled || disponiveisFiltrados.filter((o) => !o.disabled).length === 0
          }
          aria-label="Associar todos"
          title="Associar todos"
        >
          <ChevronsRight size={18} />
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={removerDestacados}
          disabled={disabled || destaqueSelecionados.length === 0}
          aria-label="Remover selecionados"
          title="Remover selecionados"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={removerTodos}
          disabled={disabled || associadosFiltrados.length === 0}
          aria-label="Remover todos"
          title="Remover todos"
        >
          <ChevronsLeft size={18} />
        </button>
      </div>

      <div className={styles.panel}>
        <p className={styles.panelTitle}>{selectedLabel}</p>
        <input
          type="text"
          className={styles.search}
          data-search-input
          placeholder="Pesquisar..."
          value={buscaSelecionados}
          onChange={(e) => setBuscaSelecionados(e.target.value)}
          disabled={disabled}
          aria-label="Pesquisar sistemas associados"
        />
        {renderLista(
          associadosFiltrados,
          'selecionados',
          destaqueSelecionados,
          'Nenhum sistema associado.'
        )}
        <span className={styles.count}>{associados.length} associado(s)</span>
      </div>
    </div>
  );
}
