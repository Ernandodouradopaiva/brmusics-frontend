import { api } from '@/lib/api';
import type { Celebracao, CelebracaoInput, CelebracaoStatus, PageResponse } from '@/types/api';

export type ListarCelebracoesParams = {
  titulo?: string;
  mes?: number;
  ano?: number;
  localCodigo?: string;
  status?: CelebracaoStatus;
  page?: number;
  size?: number;
  sort?: string;
};

export const celebracoesService = {
  listar(params?: ListarCelebracoesParams) {
    return api.get<PageResponse<Celebracao>>('/celebracoes', {
      params: {
        size: 5,
        page: 0,
        sort: 'data,desc',
        ...params,
        titulo: params?.titulo?.trim() || undefined,
        localCodigo: params?.localCodigo || undefined,
        status: params?.status || undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<Celebracao>(`/celebracoes/${codigo}`);
  },
  criar(body: CelebracaoInput) {
    return api.post<Celebracao>('/celebracoes', body);
  },
  atualizar(codigo: string, body: CelebracaoInput) {
    return api.put<Celebracao>(`/celebracoes/${codigo}`, body);
  },
  excluir(codigo: string) {
    return api.delete(`/celebracoes/${codigo}`);
  },
};
