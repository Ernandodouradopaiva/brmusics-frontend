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
    const { sort, ...rest } = params ?? {};
    return api.get<PageResponse<Celebracao>>('/celebracoes', {
      params: {
        size: 5,
        page: 0,
        ...rest,
        titulo: rest.titulo?.trim() || undefined,
        localCodigo: rest.localCodigo || undefined,
        status: rest.status || undefined,
        // Spring Data: sort=data,asc&sort=horaInicio,asc
        sort: sort ? [sort, 'horaInicio,asc'] : ['data,asc', 'horaInicio,asc'],
      },
      paramsSerializer: {
        serialize: (p) => {
          const search = new URLSearchParams();
          Object.entries(p).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            if (Array.isArray(value)) {
              value.forEach((item) => search.append(key, String(item)));
              return;
            }
            search.append(key, String(value));
          });
          return search.toString();
        },
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
  replicarMes(codigo: string, ano: number, mes: number) {
    return api.post<Celebracao>(`/celebracoes/${codigo}/replicar-mes`, { ano, mes });
  },
};
