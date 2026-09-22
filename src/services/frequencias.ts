import { api } from '@/lib/api';
import type { FrequenciaMensalItem, FrequenciaMensalPrevia, FrequenciaStatus } from '@/types/api';

export type FrequenciaMensalSalvarItem = {
  musicoCodigo: string;
  semana1?: FrequenciaStatus | null;
  semana2?: FrequenciaStatus | null;
  semana3?: FrequenciaStatus | null;
  semana4?: FrequenciaStatus | null;
};

export const frequenciasService = {
  listarMensal(ano: number, mes: number) {
    return api.get<FrequenciaMensalPrevia>('/frequencias/mensal', { params: { ano, mes } });
  },
  salvarMensal(ano: number, mes: number, itens: FrequenciaMensalSalvarItem[]) {
    return api.put<FrequenciaMensalPrevia>('/frequencias/mensal', { ano, mes, itens });
  },
};

export function toSalvarItem(item: FrequenciaMensalItem): FrequenciaMensalSalvarItem {
  return {
    musicoCodigo: item.musicoCodigo,
    semana1: item.semana1 ?? null,
    semana2: item.semana2 ?? null,
    semana3: item.semana3 ?? null,
    semana4: item.semana4 ?? null,
  };
}
