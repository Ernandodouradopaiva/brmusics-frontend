import { api } from '@/lib/api';
import type { Grupo, GrupoInput, PageResponse, Permissao } from '@/types/api';

function normalizeList<T>(data: T[] | Record<string, T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Object.values(data);
}

export type ListarGruposParams = {
  busca?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export const gruposService = {
  listar(params?: ListarGruposParams) {
    return api.get<PageResponse<Grupo>>('/grupos', {
      params: {
        size: 5,
        page: 0,
        sort: 'nome',
        ...params,
        busca: params?.busca?.trim() || undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<Grupo>(`/grupos/${codigo}`);
  },
  criar(body: GrupoInput) {
    return api.post<Grupo>('/grupos', body);
  },
  atualizar(codigo: string, body: GrupoInput) {
    return api.put<Grupo>(`/grupos/${codigo}`, body);
  },
  excluir(codigo: string) {
    return api.delete(`/grupos/${codigo}`);
  },
  listarPermissoes(codigoGrupo: string) {
    return api.get<Permissao[] | Record<string, Permissao>>(`/grupos/${codigoGrupo}/permissoes`).then((res) => ({
      ...res,
      data: normalizeList(res.data),
    }));
  },
  associarPermissao(codigoGrupo: string, codigoPermissao: string) {
    return api.put(`/grupos/${codigoGrupo}/permissoes/${codigoPermissao}`);
  },
  substituirPermissoesPorChaves(codigoGrupo: string, permissoes: string[]) {
    return api.put(`/grupos/${codigoGrupo}/permissoes`, { permissoes });
  },
};
