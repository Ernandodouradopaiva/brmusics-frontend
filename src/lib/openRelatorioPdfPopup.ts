import { getAppBasePath } from '@/lib/app-base-path';
import {
  PDF_VIEWER_OPEN,
  PDF_VIEWER_READY,
} from '@/lib/relatorioPdfViewerMessage';

export class RelatorioPdfPopupBlockedError extends Error {
  constructor() {
    super('Pop-up bloqueado. Permita pop-ups para este site e tente novamente.');
    this.name = 'RelatorioPdfPopupBlockedError';
  }
}

function waitViewerReady(janela: Window, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Visualizador de PDF não respondeu a tempo.'));
    }, timeoutMs);

    const handler = (event: MessageEvent) => {
      if (event.source !== janela || event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === PDF_VIEWER_READY) {
        window.clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve();
      }
    };

    window.addEventListener('message', handler);
  });
}

/**
 * Abre o PDF em nova aba com o visualizador interno (PDF.js).
 * Evita store em memória no servidor — que falha com várias réplicas no K8s
 * (POST em um pod, GET em outro → "PDF expirado ou não encontrado").
 */
export async function openRelatorioPdfPopup(
  filename: string,
  carregarPdf: () => Promise<Blob>,
): Promise<void> {
  const base = getAppBasePath();
  const janela = window.open(`${base}/relatorios/visualizador-pdf`, '_blank');
  if (!janela) {
    throw new RelatorioPdfPopupBlockedError();
  }

  const viewerReady = waitViewerReady(janela);

  try {
    const data = await carregarPdf();
    const blob = data.type === 'application/pdf' ? data : new Blob([data], { type: 'application/pdf' });
    if (!blob.size) {
      janela.close();
      throw new Error('PDF vazio.');
    }

    await viewerReady;
    if (janela.closed) {
      throw new RelatorioPdfPopupBlockedError();
    }

    const buffer = await blob.arrayBuffer();
    janela.postMessage(
      { type: PDF_VIEWER_OPEN, filename, buffer },
      window.location.origin,
      [buffer],
    );
  } catch (error) {
    try {
      janela.close();
    } catch {
      /* janela já fechada / inacessível */
    }
    if (error instanceof RelatorioPdfPopupBlockedError) {
      throw error;
    }
    if (error instanceof Error && error.message.trim()) {
      throw error;
    }
    throw new Error('Não foi possível gerar o PDF.');
  }
}
