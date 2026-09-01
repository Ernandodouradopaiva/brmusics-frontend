export const PDF_VIEWER_READY = 'hub-pdf-viewer-ready';
export const PDF_VIEWER_OPEN = 'hub-pdf-open';

export type PdfViewerOpenMessage = {
  type: typeof PDF_VIEWER_OPEN;
  filename: string;
  buffer: ArrayBuffer;
};

export function isPdfViewerOpenMessage(data: unknown): data is PdfViewerOpenMessage {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const msg = data as PdfViewerOpenMessage;
  return (
    msg.type === PDF_VIEWER_OPEN &&
    typeof msg.filename === 'string' &&
    msg.buffer instanceof ArrayBuffer
  );
}
