import { api } from '@/lib/api';
import type { Repertorio, RepertorioMensalItem } from '@/types/api';

export const meuRepertorioService = {
  listar() {
    return api.get<RepertorioMensalItem[]>('/meu-repertorio');
  },
  buscar(codigo: string) {
    return api.get<Repertorio>(`/meu-repertorio/${codigo}`);
  },
  buscarPorCelebracao(celebracaoCodigo: string) {
    return api.get<Repertorio>(`/meu-repertorio/por-celebracao/${celebracaoCodigo}`);
  },
};
