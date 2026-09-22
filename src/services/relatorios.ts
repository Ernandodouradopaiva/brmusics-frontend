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

async function baixarPdf(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<Blob> {
  try {
    const response = await api.get<Blob>(path, {
      params,
      responseType: 'blob',
    });
    return await assertPdfBlob(response.data);
  } catch (err) {
    throw await normalizeApiError(err);
  }
}

export type RelatorioPeriodoParams = {
  ano?: number;
  mes?: number;
};

export const relatoriosService = {
  async baixarUsuariosPdf(params?: { busca?: string; ativo?: boolean }): Promise<Blob> {
    return baixarPdf('/relatorios/usuarios.pdf', params);
  },
  async abrirPdfUsuarios(params?: { busca?: string; ativo?: boolean }): Promise<void> {
    await openRelatorioPdfPopup('relatorio-usuarios.pdf', () => this.baixarUsuariosPdf(params));
  },

  baixarMusicasPdf() {
    return baixarPdf('/relatorios/musicas.pdf');
  },
  abrirPdfMusicas() {
    return openRelatorioPdfPopup('relatorio-musicas.pdf', () => this.baixarMusicasPdf());
  },

  baixarMusicosPdf() {
    return baixarPdf('/relatorios/musicos.pdf');
  },
  abrirPdfMusicos() {
    return openRelatorioPdfPopup('relatorio-musicos.pdf', () => this.baixarMusicosPdf());
  },

  baixarMusicosEscalaPdf(params?: RelatorioPeriodoParams) {
    return baixarPdf('/relatorios/musicos-escala.pdf', params);
  },
  abrirPdfMusicosEscala(params?: RelatorioPeriodoParams) {
    return openRelatorioPdfPopup('relatorio-musicos-escala.pdf', () => this.baixarMusicosEscalaPdf(params));
  },

  baixarEscalasPdf(params?: RelatorioPeriodoParams) {
    return baixarPdf('/relatorios/escalas.pdf', params);
  },
  abrirPdfEscalas(params?: RelatorioPeriodoParams) {
    return openRelatorioPdfPopup('relatorio-escalas.pdf', () => this.baixarEscalasPdf(params));
  },

  baixarRepertoriosPdf(params?: RelatorioPeriodoParams) {
    return baixarPdf('/relatorios/repertorios.pdf', params);
  },
  abrirPdfRepertorios(params?: RelatorioPeriodoParams) {
    return openRelatorioPdfPopup('relatorio-repertorios.pdf', () => this.baixarRepertoriosPdf(params));
  },

  baixarCelebracoesMesPdf(params?: RelatorioPeriodoParams) {
    return baixarPdf('/relatorios/celebracoes-mes.pdf', params);
  },
  abrirPdfCelebracoesMes(params?: RelatorioPeriodoParams) {
    return openRelatorioPdfPopup('relatorio-celebracoes-mes.pdf', () => this.baixarCelebracoesMesPdf(params));
  },

  baixarMusicosFuncoesPdf() {
    return baixarPdf('/relatorios/musicos-funcoes.pdf');
  },
  abrirPdfMusicosFuncoes() {
    return openRelatorioPdfPopup('relatorio-musicos-funcoes.pdf', () => this.baixarMusicosFuncoesPdf());
  },
};
