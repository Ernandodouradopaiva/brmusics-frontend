import { api } from '@/lib/api';
import type { PageResponse, WhatsAppComunicacaoPrevia, WhatsAppEnvio, WhatsAppEnvioStatus, WhatsAppTipoMensagem } from '@/types/api';

export type ListarWhatsAppEnviosParams = {
  status?: WhatsAppEnvioStatus | '';
  tipoMensagem?: WhatsAppTipoMensagem | '';
  telefone?: string;
  musico?: string;
  page?: number;
  size?: number;
  sort?: string;
  somenteErros?: boolean;
};

export const whatsappService = {
  listar(params?: ListarWhatsAppEnviosParams) {
    const path = params?.somenteErros ? '/whatsapp/envios/erros' : '/whatsapp/envios';
    return api.get<PageResponse<WhatsAppEnvio>>(path, {
      params: {
        size: 5,
        page: 0,
        sort: 'dataSolicitacao,desc',
        ...params,
        status: params?.somenteErros ? undefined : params?.status || undefined,
        tipoMensagem: params?.tipoMensagem || undefined,
        telefone: params?.telefone?.trim() || undefined,
        musico: params?.musico?.trim() || undefined,
        somenteErros: undefined,
      },
    });
  },
  buscar(codigo: string) {
    return api.get<WhatsAppEnvio>(`/whatsapp/envios/${codigo}`);
  },
  reenviar(codigo: string) {
    return api.post<WhatsAppEnvio>(`/whatsapp/envios/${codigo}/reenviar`);
  },
  reenviarPendentes() {
    return api.post<{ reenviados: number }>('/whatsapp/envios/reenviar-pendentes');
  },
  lembretes(ano: number, mes: number) {
    return api.post<{ enfileirados: number }>('/whatsapp/envios/lembretes', { ano, mes });
  },
  previaComunicacao(ano: number, mes: number) {
    return api.get<WhatsAppComunicacaoPrevia>('/whatsapp/comunicacoes/previa', { params: { ano, mes } });
  },
  comunicarAlteracoes(ano: number, mes: number) {
    return api.post<{ enfileirados: number }>('/whatsapp/comunicacoes', { ano, mes });
  },
};
