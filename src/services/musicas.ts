import { api } from '@/lib/api';
import type { CategoriaLiturgica, Musica, MusicaInput, PageResponse } from '@/types/api';

export type ListarMusicasParams = {
  titulo?: string;
  autor?: string;
  categoria?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export const musicasService = {
  listar(params?: ListarMusicasParams) {
    return api.get<PageResponse<Musica>>('/musicas', {
      params: {
        size: 5,
        page: 0,
        sort: 'titulo',
        ...params,
        titulo: params?.titulo?.trim() || undefined,
        autor: params?.autor?.trim() || undefined,
        categoria: params?.categoria || undefined,
      },
    });
  },
  categorias() {
    return api.get<CategoriaLiturgica[]>('/musicas/categorias');
  },
  buscar(codigo: string) {
    return api.get<Musica>(`/musicas/${codigo}`);
  },
  criar(body: MusicaInput) {
    return api.post<Musica>('/musicas', body);
  },
  atualizar(codigo: string, body: MusicaInput) {
    return api.put<Musica>(`/musicas/${codigo}`, body);
  },
  atualizarAtivo(codigo: string, ativo: boolean) {
    return api.put<Musica>(`/musicas/${codigo}/ativo`, { ativo });
  },
  excluir(codigo: string) {
    return api.delete(`/musicas/${codigo}`);
  },
};
