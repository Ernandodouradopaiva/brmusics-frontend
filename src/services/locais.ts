import { api } from '@/lib/api';
import type { Local, LocalInput, PageResponse } from '@/types/api';

export type ListarLocaisParams = {
  nome?: string;
  cidade?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export const locaisService = {
  listar(params?: ListarLocaisParams) {
    return api.get<PageResponse<Local>>('/locais', {
      params: {
        size: 5,
        page: 0,
        sort: 'nome',
        ...params,
        nome: params?.nome?.trim() || undefined,
        cidade: params?.cidade?.trim() || undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<Local>(`/locais/${codigo}`);
  },
  criar(body: LocalInput) {
    return api.post<Local>('/locais', body);
  },
  atualizar(codigo: string, body: LocalInput) {
    return api.put<Local>(`/locais/${codigo}`, body);
  },
  atualizarAtivo(codigo: string, ativo: boolean) {
    return api.put<Local>(`/locais/${codigo}/ativo`, { ativo });
  },
  excluir(codigo: string) {
    return api.delete(`/locais/${codigo}`);
  },
};
