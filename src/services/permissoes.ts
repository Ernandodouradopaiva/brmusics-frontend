import { api } from '@/lib/api';
import type { PageResponse, Permissao, PermissaoArvoreNodeModel } from '@/types/api';

export type ListarPermissoesParams = {
  busca?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export const permissoesService = {
  arvore() {
    return api.get<PermissaoArvoreNodeModel[]>('/permissoes/arvore');
  },
  listar(params?: ListarPermissoesParams) {
    return api.get<PageResponse<Permissao>>('/permissoes', {
      params: {
        size: 5,
        page: 0,
        sort: 'ordem',
        ...params,
        busca: params?.busca?.trim() || undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<Permissao>(`/permissoes/${codigo}`);
  },
};
