'use client';

import Link from 'next/link';
import type { MinhaEscalaItem } from '@/types/api';
import { formatarDataIso, formatarHoraAmigavel, primeiroNome } from '@/lib/musicoFormat';
import styles from '@/app/musico/musico.module.css';

function metaCelebracao(item: MinhaEscalaItem): string {
  const partes = [item.diaSemana, formatarHoraAmigavel(item.horaInicio)].filter(Boolean);
  return partes.join(' • ');
}

export function CardProximaEscala({ item }: { item: MinhaEscalaItem }) {
  const hrefRepertorio = item.repertorioCodigo
    ? `/meu-repertorio/${item.repertorioCodigo}`
    : `/meu-repertorio/celebracao/${item.celebracaoCodigo}`;
  return (
    <article className={styles.cardDestaque}>
      <p className={styles.cardData}>{formatarDataIso(item.data)}</p>
      <p className={styles.cardMeta}>{metaCelebracao(item)}</p>
      <h3 className={styles.cardTitulo}>{item.titulo}</h3>
      <p className={styles.rotulo}>Função</p>
      <p className={styles.valor}>{item.minhaFuncao || '—'}</p>
      <p className={styles.rotulo}>Equipe</p>
      <ul className={styles.equipe}>
        {(item.equipe ?? []).map((membro, indice) => (
          <li key={`${membro.musicoNome}-${indice}`}>
            {membro.musicoNome}
            {membro.instrumentoNome ? ` — ${membro.instrumentoNome}` : ''}
          </li>
        ))}
      </ul>
      <Link href={hrefRepertorio} className={styles.btnRepertorio}>
        Ver repertório
      </Link>
    </article>
  );
}

export function CardEscalaResumo({ item }: { item: MinhaEscalaItem }) {
  return (
    <Link href={`/minha-escala/${item.escalaCodigo}`} className={styles.cardLista}>
      <p className={styles.cardListaTitulo}>{item.titulo}</p>
      <p className={styles.cardListaMeta}>
        {formatarDataIso(item.data)}
        {item.diaSemana ? ` • ${item.diaSemana}` : ''}
        {item.horaInicio ? ` • ${formatarHoraAmigavel(item.horaInicio)}` : ''}
        {item.minhaFuncao ? ` • ${item.minhaFuncao}` : ''}
      </p>
    </Link>
  );
}

export function SaudacaoMusico({ nome }: { nome?: string | null }) {
  return <h1 className={styles.saudacao}>Olá, {primeiroNome(nome)}</h1>;
}
