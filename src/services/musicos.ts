import { api } from '@/lib/api';
import type { Musico, MusicoInput, PageResponse } from '@/types/api';

export type ListarMusicosParams = {
  nome?: string;
  telefone?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export const musicosService = {
  listar(params?: ListarMusicosParams) {
    return api.get<PageResponse<Musico>>('/musicos', {
      params: {
        size: 5,
        page: 0,
        sort: 'nome',
        ...params,
        nome: params?.nome?.trim() || undefined,
        telefone: params?.telefone?.trim() || undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<Musico>(`/musicos/${codigo}`);
  },
  criar(body: MusicoInput) {
    return api.post<Musico>('/musicos', body);
  },
  atualizar(codigo: string, body: MusicoInput) {
    return api.put<Musico>(`/musicos/${codigo}`, body);
  },
  atualizarAtivo(codigo: string, ativo: boolean) {
    return api.put<Musico>(`/musicos/${codigo}/ativo`, { ativo });
  },
  excluir(codigo: string) {
    return api.delete(`/musicos/${codigo}`);
  },
};
