import { api } from '@/lib/api';
import { normalizeApiError } from '@/lib/apiError';
import {
  openRelatorioPdfPopup,
  RelatorioPdfPopupBlockedError,
} from '@/lib/openRelatorioPdfPopup';

export { RelatorioPdfPopupBlockedError };

async function assertPdfBlob(blob: Blob): Promise<Blob> {
  if (!blob || blob.size === 0) {
    throw new Error('O relatório retornou vazio. Tente novamente.');
  }

  const type = (blob.type || '').toLowerCase();
  if (type.includes('json') || type.includes('text') || type.includes('html')) {
    const text = await blob.text();
    let msg = 'Não foi possível gerar o relatório.';
    try {
      const json = JSON.parse(text) as {
        userMessage?: string;
        detail?: string;
        message?: string;
        mensagem?: string;
      };
      msg =
        json.userMessage?.trim() ||
        json.detail?.trim() ||
        json.mensagem?.trim() ||
        json.message?.trim() ||
        msg;
    } catch {
      if (text.trim()) msg = text.trim();
    }
    throw new Error(msg);
  }

  const magic = await blob.slice(0, 5).text();
  if (!magic.startsWith('%PDF')) {
    throw new Error('A resposta do servidor não é um PDF válido. Tente novamente.');
  }

  return blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
}

export const relatoriosService = {
  async baixarUsuariosPdf(params?: { busca?: string; ativo?: boolean }): Promise<Blob> {
    try {
      const response = await api.get<Blob>('/relatorios/usuarios.pdf', {
        params,
        responseType: 'blob',
      });
      return await assertPdfBlob(response.data);
    } catch (err) {
      throw await normalizeApiError(err);
    }
  },

  /** Gera o PDF e abre no visualizador nativo em nova aba (padrão HubSocial/Conecta). */
  async abrirPdfUsuarios(params?: { busca?: string; ativo?: boolean }): Promise<void> {
    await openRelatorioPdfPopup('relatorio-usuarios.pdf', () => this.baixarUsuariosPdf(params));
  },
};
