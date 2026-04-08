/**
 * Configura o worker do PDF.js uma vez, com URL resolvida pelo Vite (?url).
 * Evita falhas em produção ("Failed to fetch dynamically imported module" para /assets/pdf.worker-*.mjs)
 * quando o CDN ou o fake worker não coincidem com o bundle.
 */
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
