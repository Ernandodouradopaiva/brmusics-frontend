import { api } from '@/lib/api';
import type {
  Escala,
  EscalaInput,
  EscalaMensalItem,
  EscalaPublicacao,
  EscalaPublicacaoPrevia,
} from '@/types/api';

export const escalasService = {
  listarMensal(ano: number, mes: number) {
    return api.get<EscalaMensalItem[]>('/escalas/mensal', { params: { ano, mes } });
  },
  previaPublicacao(ano: number, mes: number) {
    return api.get<EscalaPublicacaoPrevia>('/escalas/publicacoes/previa', { params: { ano, mes } });
  },
  publicar(ano: number, mes: number) {
    return api.post<EscalaPublicacao>('/escalas/publicacoes', { ano, mes });
  },
  publicarUma(codigo: string) {
    return api.post<Escala>(`/escalas/${codigo}/publicar`);
  },
  buscar(codigo: string) {
    return api.get<Escala>(`/escalas/${codigo}`);
  },
  criar(body: EscalaInput) {
    return api.post<Escala>('/escalas', body);
  },
  atualizar(codigo: string, body: EscalaInput) {
    return api.put<Escala>(`/escalas/${codigo}`, body);
  },
  copiar(origemCelebracaoCodigo: string, destinoCelebracaoCodigo: string) {
    return api.post<Escala>('/escalas/copiar', { origemCelebracaoCodigo, destinoCelebracaoCodigo });
  },
  duplicarAnterior(celebracaoDestinoCodigo: string) {
    return api.post<Escala>('/escalas/duplicar-anterior', { celebracaoDestinoCodigo });
  },
  excluir(codigo: string) {
    return api.delete(`/escalas/${codigo}`);
  },
};
