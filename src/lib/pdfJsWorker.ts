import { getAppBasePath } from '@/lib/app-base-path';

/** Worker servido de /public para evitar falha de CDN/CORS no Firefox. */
export function configurePdfJsWorker(
  GlobalWorkerOptions: { workerSrc: string },
): void {
  const base = getAppBasePath();
  GlobalWorkerOptions.workerSrc = `${base}/pdfjs/pdf.worker.min.mjs`;
}
