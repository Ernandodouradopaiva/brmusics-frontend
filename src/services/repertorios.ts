import { api } from '@/lib/api';
import type { CategoriaLiturgica, Repertorio, RepertorioInput, RepertorioMensalItem } from '@/types/api';

export const repertoriosService = {
  listarMensal(ano: number, mes: number) {
    return api.get<RepertorioMensalItem[]>('/repertorios/mensal', { params: { ano, mes } });
  },
  momentos() {
    return api.get<CategoriaLiturgica[]>('/repertorios/momentos');
  },
  buscar(codigo: string) {
    return api.get<Repertorio>(`/repertorios/${codigo}`);
  },
  buscarPorCelebracao(celebracaoCodigo: string) {
    return api.get<Repertorio>(`/repertorios/por-celebracao/${celebracaoCodigo}`);
  },
  criar(body: RepertorioInput) {
    return api.post<Repertorio>('/repertorios', body);
  },
  atualizar(codigo: string, body: RepertorioInput) {
    return api.put<Repertorio>(`/repertorios/${codigo}`, body);
  },
  excluir(codigo: string) {
    return api.delete(`/repertorios/${codigo}`);
  },
};
