import { api } from '@/lib/api';
import type { MinhaEscalaAgenda, MinhaEscalaItem } from '@/types/api';

export const minhaEscalaService = {
  agenda() {
    return api.get<MinhaEscalaAgenda>('/minha-escala');
  },
  buscar(codigo: string) {
    return api.get<MinhaEscalaItem>(`/minha-escala/${codigo}`);
  },
};
