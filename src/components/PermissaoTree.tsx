'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { PermissaoArvoreNodeModel } from '@/types/api';
import styles from './PermissaoTree.module.css';

export type ArvoreSelecaoTextos = {
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  statsPrefix?: string;
  expandirTudo?: string;
  recolherTudo?: string;
  marcarTodas?: string;
  limpar?: string;
  empty?: string;
  marcarTodasTitle?: string;
  limparTitle?: string;
};

const TEXTOS_PERMISSAO_PADRAO: Required<ArvoreSelecaoTextos> = {
  searchPlaceholder: 'Buscar permissão...',
  searchAriaLabel: 'Buscar permissão',
  statsPrefix: 'Selecionadas',
  expandirTudo: 'Expandir tudo',
  recolherTudo: 'Recolher tudo',
  marcarTodas: 'Marcar todas',
  limpar: 'Limpar',
  empty: 'Nenhuma permissão encontrada para esta busca.',
  marcarTodasTitle: 'Aguarde o carregamento da árvore de permissões',
  limparTitle: 'No seu próprio grupo, permissões de administração de grupos permanecem ativas',
};

type Props = {
  arvore: PermissaoArvoreNodeModel[];
  selecionadas: Set<string>;
  onChange: (chaves: Set<string>) => void;
  /** Chaves que não podem ser desmarcadas (ex.: administração de grupos no próprio perfil). */
  chavesFixas?: ReadonlySet<string>;
  disabled?: boolean;
  textos?: ArvoreSelecaoTextos;
};

function coletarChavesFolha(node: PermissaoArvoreNodeModel): string[] {
  if (node.chave) return [node.chave];
  const out: string[] = [];
  for (const f of node.filhos ?? []) {
    out.push(...coletarChavesFolha(f));
  }
  return out;
}

function coletarTodasChavesFolha(nodes: PermissaoArvoreNodeModel[]): string[] {
  return nodes.flatMap(coletarChavesFolha);
}

function chaveExpandirNode(node: PermissaoArvoreNodeModel, depth: number): string {
  return node.chave ?? `${node.modulo}-${node.recurso}-${depth}`;
}

function coletarChavesGrupo(nodes: PermissaoArvoreNodeModel[], depth = 0): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.chave) continue;
    out.push(chaveExpandirNode(n, depth));
    if (n.filhos?.length) {
      out.push(...coletarChavesGrupo(n.filhos, depth + 1));
    }
  }
  return out;
}

export function PermissaoTree({
  arvore,
  selecionadas,
  onChange,
  chavesFixas,
  disabled = false,
  textos,
}: Props) {
  const t = { ...TEXTOS_PERMISSAO_PADRAO, ...textos };
  const [busca, setBusca] = useState('');
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const todasChaves = useMemo(() => coletarTodasChavesFolha(arvore), [arvore]);
  const chavesGrupo = useMemo(() => coletarChavesGrupo(arvore), [arvore]);

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return arvore;
    function filtrar(nodes: PermissaoArvoreNodeModel[]): PermissaoArvoreNodeModel[] {
      return nodes
        .map((n) => {
          const filhos = n.filhos ? filtrar(n.filhos) : [];
          const match =
            (n.descricao?.toLowerCase().includes(q) ?? false) ||
            (n.chave?.toLowerCase().includes(q) ?? false);
          if (match || filhos.length) return { ...n, filhos };
          return null;
        })
        .filter(Boolean) as PermissaoArvoreNodeModel[];
    }
    return filtrar(arvore);
  }, [arvore, busca]);

  const aplicarFixas = (set: Set<string>) => {
    if (chavesFixas) {
      for (const c of chavesFixas) set.add(c);
    }
    return set;
  };

  const toggleChave = (chave: string, checked: boolean) => {
    if (disabled) return;
    if (!checked && chavesFixas?.has(chave)) return;
    const next = new Set(selecionadas);
    if (checked) next.add(chave);
    else next.delete(chave);
    onChange(aplicarFixas(next));
  };

  const toggleNode = (node: PermissaoArvoreNodeModel, checked: boolean) => {
    if (disabled) return;
    const chaves = coletarChavesFolha(node);
    const next = new Set(selecionadas);
    for (const c of chaves) {
      if (!checked && chavesFixas?.has(c)) continue;
      if (checked) next.add(c);
      else next.delete(c);
    }
    onChange(aplicarFixas(next));
  };

  const marcarTodas = () => {
    if (todasChaves.length === 0) return;
    onChange(aplicarFixas(new Set(todasChaves)));
  };
  const limparTodas = () => onChange(aplicarFixas(new Set()));

  const expandirTudo = () => {
    const next: Record<string, boolean> = {};
    for (const k of chavesGrupo) next[k] = true;
    setAbertos(next);
  };

  const recolherTudo = () => {
    const next: Record<string, boolean> = {};
    for (const k of chavesGrupo) next[k] = false;
    setAbertos(next);
  };

  const renderLeaf = (node: PermissaoArvoreNodeModel) => {
    if (!node.chave) return null;
    const fixa = chavesFixas?.has(node.chave) ?? false;
    return (
      <label key={node.chave} className={styles.leafRow} title={fixa ? 'Obrigatória no seu próprio grupo' : undefined}>
        <input
          type="checkbox"
          className={styles.check}
          checked={selecionadas.has(node.chave)}
          disabled={disabled || fixa}
          onChange={(e) => toggleChave(node.chave!, e.target.checked)}
        />
        <span className={styles.leafLabel}>{node.descricao ?? node.chave}</span>
      </label>
    );
  };

  const renderNode = (node: PermissaoArvoreNodeModel, depth = 0): React.ReactNode => {
    if (node.chave) {
      return renderLeaf(node);
    }

    const key = chaveExpandirNode(node, depth);
    const folhas = coletarChavesFolha(node);
    const marcadas = folhas.filter((c) => selecionadas.has(c)).length;
    const folhasRemoviveis = chavesFixas
      ? folhas.filter((c) => !chavesFixas.has(c))
      : folhas;
    const marcadasRemoviveis = folhasRemoviveis.filter((c) => selecionadas.has(c)).length;
    const todas =
      folhas.length > 0 &&
      folhas.every((c) => selecionadas.has(c) || (chavesFixas?.has(c) ?? false));
    const parcial =
      marcadas > 0 &&
      !todas &&
      (folhasRemoviveis.length === 0 ? false : marcadasRemoviveis < folhasRemoviveis.length);
    const aberto = busca.trim() ? true : (abertos[key] ?? true);
    const titulo = node.descricao ?? node.recurso ?? node.modulo ?? 'Grupo';

    return (
      <div key={key} className={styles.groupBlock} data-depth={depth}>
        <div className={styles.groupHeader}>
          <button
            type="button"
            className={styles.expandBtn}
            onClick={() => setAbertos((p) => ({ ...p, [key]: !aberto }))}
            aria-expanded={aberto}
            aria-label={aberto ? `Recolher ${titulo}` : `Expandir ${titulo}`}
          >
            {aberto ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
          </button>
          <input
            type="checkbox"
            className={styles.check}
            ref={(el) => {
              if (el) el.indeterminate = parcial;
            }}
            checked={todas}
            disabled={disabled}
            onChange={(e) => toggleNode(node, e.target.checked)}
            aria-label={`Selecionar todas em ${titulo}`}
          />
          <span className={styles.groupTitle}>{titulo}</span>
          <span className={styles.countBadge}>
            {marcadas}/{folhas.length}
          </span>
        </div>
        {aberto && (
          <div className={styles.groupBody}>
            {(node.filhos ?? []).map((f) => renderNode(f, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.root} data-permissao-tree>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={16} strokeWidth={2} aria-hidden />
          <input
            type="search"
            placeholder={t.searchPlaceholder}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={styles.searchInput}
            aria-label={t.searchAriaLabel}
            disabled={disabled}
          />
        </div>
        <span className={styles.stats}>
          {t.statsPrefix}: <strong>{selecionadas.size}</strong>
          {todasChaves.length > 0 && (
            <>
              {' '}
              / <strong>{todasChaves.length}</strong>
            </>
          )}
        </span>
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={expandirTudo}
            disabled={disabled || chavesGrupo.length === 0}
          >
            {t.expandirTudo}
          </button>
          <span className={styles.toolbarSep} aria-hidden>
            |
          </span>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={recolherTudo}
            disabled={disabled || chavesGrupo.length === 0}
          >
            {t.recolherTudo}
          </button>
          <span className={styles.toolbarSep} aria-hidden>
            |
          </span>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={marcarTodas}
            disabled={disabled || todasChaves.length === 0}
            title={todasChaves.length === 0 ? t.marcarTodasTitle : undefined}
          >
            {t.marcarTodas}
          </button>
          <span className={styles.toolbarSep} aria-hidden>
            |
          </span>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={limparTodas}
            disabled={
              disabled ||
              (chavesFixas != null && chavesFixas.size > 0 && chavesFixas.size === todasChaves.length)
            }
            title={chavesFixas?.size ? t.limparTitle : undefined}
          >
            {t.limpar}
          </button>
        </div>
      </div>

      <div className={styles.treePanel}>
        {filtrada.length === 0 ? (
          <p className={styles.empty}>{t.empty}</p>
        ) : (
          filtrada.map((n) => renderNode(n))
        )}
      </div>
    </div>
  );
}
