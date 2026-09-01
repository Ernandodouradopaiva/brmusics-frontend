import styles from './listagem.module.css';

interface ListagemTituloProps {
  recurso: string;
}

export function ListagemTitulo({ recurso }: ListagemTituloProps) {
  return <h1 className={styles.titulo}>LISTAGEM DE {recurso.toUpperCase()}</h1>;
}
