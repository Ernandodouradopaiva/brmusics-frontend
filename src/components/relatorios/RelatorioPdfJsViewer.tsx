'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  PanelLeft,
  Plus,
  Printer,
} from 'lucide-react';
import { configurePdfJsWorker } from '@/lib/pdfJsWorker';
import styles from './RelatorioPdfJsViewer.module.css';

const ZOOM_STEP = 1.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

type Props = {
  filename: string;
  bytes: Uint8Array;
};

export function RelatorioPdfJsViewer({ filename, bytes }: Props) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const pdfViewerRef = useRef<import('pdfjs-dist/web/pdf_viewer.mjs').PDFViewer | null>(null);
  const bytesRef = useRef(bytes);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [ready, setReady] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  bytesRef.current = bytes;

  const syncZoom = useCallback(() => {
    const viewer = pdfViewerRef.current;
    if (!viewer) {
      return;
    }
    setZoomPercent(Math.round(viewer.currentScale * 100));
  }, []);

  useLayoutEffect(() => {
    let alive = true;

    const init = async () => {
      const container = viewerContainerRef.current;
      const viewerEl = viewerRef.current;
      const thumbContainer = thumbnailsRef.current;
      if (!container || !viewerEl || !thumbContainer) {
        return;
      }

      viewerEl.replaceChildren();
      thumbContainer.replaceChildren();
      pdfViewerRef.current?.cleanup();
      pdfViewerRef.current = null;

      try {
        const pdfjs = await import('pdfjs-dist');
        const viewerMod = await import('pdfjs-dist/web/pdf_viewer.mjs');

        if (!alive) {
          return;
        }

        configurePdfJsWorker(pdfjs.GlobalWorkerOptions);

        const eventBus = new viewerMod.EventBus();
        const linkService = new viewerMod.PDFLinkService({ eventBus });
        const pdfViewer = new viewerMod.PDFViewer({
          container,
          viewer: viewerEl,
          eventBus,
          linkService,
          removePageBorders: false,
        });

        linkService.setViewer(pdfViewer);
        pdfViewerRef.current = pdfViewer;

        eventBus.on('pagechanging', (evt: { pageNumber: number }) => {
          if (alive) {
            setCurrentPage(evt.pageNumber);
          }
        });
        eventBus.on('scalechanging', () => {
          if (alive) {
            syncZoom();
          }
        });

        const pdfData = bytesRef.current.slice();
        const pdf = await pdfjs.getDocument({ data: pdfData }).promise;

        if (!alive) {
          return;
        }

        pdfViewer.setDocument(pdf);
        linkService.setDocument(pdf);

        await pdfViewer.pagesPromise;

        if (!alive) {
          return;
        }

        pdfViewer.currentScaleValue = 'page-width';
        setPageCount(pdf.numPages);
        setCurrentPage(1);
        syncZoom();

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          if (!alive) {
            return;
          }
          const viewport = page.getViewport({ scale: 0.18 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (!context) {
            continue;
          }
          await page.render({ canvasContext: context, viewport }).promise;

          const button = document.createElement('button');
          button.type = 'button';
          button.className = styles.thumbnailBtn;
          button.dataset.page = String(pageNumber);
          button.setAttribute('aria-label', `Página ${pageNumber}`);
          button.appendChild(canvas);

          const label = document.createElement('span');
          label.className = styles.thumbnailLabel;
          label.textContent = String(pageNumber);
          button.appendChild(label);

          button.addEventListener('click', () => {
            pdfViewer.currentPageNumber = pageNumber;
          });

          thumbContainer.appendChild(button);
        }

        setErro(null);
        setReady(true);
      } catch {
        if (alive) {
          setErro('Não foi possível renderizar o PDF. Tente baixar o arquivo.');
          setReady(false);
        }
      }
    };

    void init();

    return () => {
      alive = false;
      pdfViewerRef.current?.cleanup();
      pdfViewerRef.current = null;
    };
  }, [bytes, syncZoom]);

  useLayoutEffect(() => {
    const thumbContainer = thumbnailsRef.current;
    if (!thumbContainer || !ready) {
      return;
    }
    thumbContainer.querySelectorAll(`.${styles.thumbnailBtn}`).forEach((el) => {
      el.classList.toggle(styles.thumbnailActive, el.getAttribute('data-page') === String(currentPage));
    });
    const active = thumbContainer.querySelector(`.${styles.thumbnailActive}`);
    active?.scrollIntoView({ block: 'nearest' });
  }, [currentPage, ready]);

  const goToPage = (page: number) => {
    const viewer = pdfViewerRef.current;
    if (!viewer || page < 1 || page > pageCount) {
      return;
    }
    viewer.currentPageNumber = page;
  };

  const zoomBy = (factor: number) => {
    const viewer = pdfViewerRef.current;
    if (!viewer) {
      return;
    }
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewer.currentScale * factor));
    viewer.currentScale = next;
    syncZoom();
  };

  const fitWidth = () => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.currentScaleValue = 'page-width';
    }
    syncZoom();
  };

  const download = () => {
    const blob = new Blob([bytesRef.current.slice()], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    window.print();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Ocultar miniaturas' : 'Exibir miniaturas'}
          title="Miniaturas"
        >
          <PanelLeft size={18} />
        </button>

        <span className={styles.filename} title={filename}>
          {filename}
        </span>

        <div className={styles.pageControls}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className={styles.pageInfo}>
            <input
              className={styles.pageInput}
              type="number"
              min={1}
              max={pageCount || 1}
              value={currentPage}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) {
                  goToPage(n);
                }
              }}
              aria-label="Número da página"
            />
            <span className={styles.pageTotal}>/ {pageCount || '—'}</span>
          </span>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => goToPage(currentPage + 1)}
            disabled={!pageCount || currentPage >= pageCount}
            aria-label="Próxima página"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className={styles.zoomControls}>
          <button type="button" className={styles.toolBtn} onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="Diminuir zoom">
            <Minus size={18} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={fitWidth} title="Ajustar à largura">
            <span className={styles.zoomLabel}>{zoomPercent}%</span>
          </button>
          <button type="button" className={styles.toolBtn} onClick={() => zoomBy(ZOOM_STEP)} aria-label="Aumentar zoom">
            <Plus size={18} />
          </button>
        </div>

        <div className={styles.toolbarActions}>
          <button type="button" className={styles.toolBtn} onClick={download} aria-label="Baixar PDF" title="Baixar">
            <Download size={18} />
          </button>
          <button type="button" className={styles.toolBtn} onClick={print} aria-label="Imprimir" title="Imprimir">
            <Printer size={18} />
          </button>
        </div>
      </header>

      {erro && <p className={styles.viewerError}>{erro}</p>}

      <div className={styles.body}>
        {sidebarOpen && (
          <aside className={styles.sidebar} aria-label="Miniaturas das páginas">
            <div ref={thumbnailsRef} className={styles.thumbnails} />
          </aside>
        )}

        <div
          ref={viewerContainerRef}
          className={`${styles.viewerContainer} ${sidebarOpen ? styles.viewerWithSidebar : ''}`}
        >
          <div ref={viewerRef} className="pdfViewer" />
        </div>
      </div>
    </div>
  );
}
