'use client';

import { useEffect, useState } from 'react';
import { RelatorioPdfJsViewer } from '@/components/relatorios/RelatorioPdfJsViewer';
import {
  isPdfViewerOpenMessage,
  PDF_VIEWER_OPEN,
  PDF_VIEWER_READY,
} from '@/lib/relatorioPdfViewerMessage';
import styles from './visualizador-pdf.module.css';
import 'pdfjs-dist/web/pdf_viewer.css';

type PdfPayload = {
  filename: string;
  bytes: Uint8Array;
};

export default function VisualizadorPdfPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PdfPayload | null>(null);

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: PDF_VIEWER_READY }, window.location.origin);
    }

    const handler = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.opener ||
        !isPdfViewerOpenMessage(event.data)
      ) {
        return;
      }
      if (event.data.type !== PDF_VIEWER_OPEN) {
        return;
      }

      setLoading(true);
      setErro(null);
      document.title = event.data.filename;
      const bytes = new Uint8Array(event.data.buffer);
      setPdf({ filename: event.data.filename, bytes });
      setLoading(false);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (loading && !pdf) {
    return (
      <div className={styles.loadingOnly}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} aria-hidden />
          <p className={styles.title}>Gerando relatório</p>
          <p className={styles.subtitle}>Montando o PDF no servidor. Isso pode levar alguns instantes.</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return <p className={styles.error}>{erro}</p>;
  }

  if (!pdf) {
    return null;
  }

  return <RelatorioPdfJsViewer filename={pdf.filename} bytes={pdf.bytes} />;
}
