import styles from './listagem.module.css';

export function ListagemPanel({ children }: { children: React.ReactNode }) {
  return <div className={styles.panel}>{children}</div>;
}

export function ListagemPageWrapper({ children }: { children: React.ReactNode }) {
  return <div className={styles.listagemPage}>{children}</div>;
}
