/**
 * Configura o worker do PDF.js uma vez, com URL resolvida pelo Vite (?url).
 * Em dev, o Vite pode emitir URL absoluta com `server.origin` (ex. IP público);
 * se abrires a app por outro host (Tailscale, outro túnel), o worker falha ao carregar.
 * Alinhamos sempre ao `window.location` da página actual.
 */
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

function resolvePdfWorkerSrc(imported: string): string {
  if (typeof window === "undefined") return imported;
  try {
    const u = new URL(imported, window.location.href);
    if (u.origin !== window.location.origin) {
      return `${window.location.origin}${u.pathname}${u.search}`;
    }
    return u.href;
  } catch {
    return imported;
  }
}

pdfjs.GlobalWorkerOptions.workerSrc = resolvePdfWorkerSrc(pdfWorkerUrl);
