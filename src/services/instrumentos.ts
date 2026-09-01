import { api } from '@/lib/api';
import type { Instrumento, InstrumentoInput, PageResponse } from '@/types/api';

export type ListarInstrumentosParams = {
  nome?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export const instrumentosService = {
  listar(params?: ListarInstrumentosParams) {
    return api.get<PageResponse<Instrumento>>('/instrumentos', {
      params: {
        size: 5,
        page: 0,
        sort: 'ordem',
        ...params,
        nome: params?.nome?.trim() || undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<Instrumento>(`/instrumentos/${codigo}`);
  },
  criar(body: InstrumentoInput) {
    return api.post<Instrumento>('/instrumentos', body);
  },
  atualizar(codigo: string, body: InstrumentoInput) {
    return api.put<Instrumento>(`/instrumentos/${codigo}`, body);
  },
  atualizarAtivo(codigo: string, ativo: boolean) {
    return api.put<Instrumento>(`/instrumentos/${codigo}/ativo`, { ativo });
  },
  excluir(codigo: string) {
    return api.delete(`/instrumentos/${codigo}`);
  },
};
