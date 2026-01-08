
import { Note } from "@/types";
import { generatePrintHtml } from "./htmlGenerator";
import { normalizeContent } from "./styles/normalizeStyles";
import { enhanceVacationContent } from "./vacationEnhancer";
import { mergeMultiplePdfs, isPdfUrl } from "../pdfMerger";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

let reservedPrintWindow: Window | null = null;

// HTML template for the print status window
const STATUS_WINDOW_HTML = `<!doctype html>
<html>
<head>
  <title>A preparar impressão…</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; background: #f9fafb; margin: 0; }
    .container { max-width: 500px; margin: 0 auto; }
    h1 { font-size: 18px; margin: 0 0 16px; color: #111; }
    #status { font-size: 16px; color: #374151; margin-bottom: 12px; }
    #log { font-size: 12px; color: #6b7280; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
    .error { color: #dc2626; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <h1>A preparar PDF combinado</h1>
    <div id="status"><span class="spinner"></span>A iniciar…</div>
    <div id="log"></div>
  </div>
</body>
</html>`;

/**
 * Updates the status in the print window using direct DOM manipulation
 */
function updatePrintWindowStatus(win: Window, message: string, isError = false) {
  try {
    const statusEl = win.document?.getElementById?.("status");
    const logEl = win.document?.getElementById?.("log");
    if (statusEl) {
      if (isError) {
        statusEl.innerHTML = `<span class="error">${message}</span>`;
      } else {
        statusEl.innerHTML = `<span class="spinner"></span>${message}`;
      }
    }
    if (logEl) {
      logEl.textContent = (logEl.textContent || "") + message + "\n";
    }
  } catch (err) {
    console.warn("updatePrintWindowStatus: could not update", err);
  }
}

/**
 * Pre-opens a blank tab/window synchronously to avoid popup blockers.
 * The next call to printNoteWithAttachments will reuse it.
 */
export function preopenPrintWindow(): Window | null {
  console.log("preopenPrintWindow: called");
  try {
    const w = window.open("", "_blank");
    if (!w) {
      console.error("preopenPrintWindow: popup blocked");
      toast.error("O browser bloqueou a janela de impressão (popup blocker)");
      return null;
    }

    // Write the status page HTML
    try {
      w.document.open();
      w.document.write(STATUS_WINDOW_HTML);
      w.document.close();
      console.log("preopenPrintWindow: wrote HTML to window");
    } catch (err) {
      console.warn("preopenPrintWindow: could not write status HTML", err);
    }

    reservedPrintWindow = w;
    return w;
  } catch (err) {
    console.error("preopenPrintWindow: error", err);
    toast.error("Não foi possível abrir a janela de impressão");
    return null;
  }
}

/**
 * Generates print-ready HTML with embedded styles (not @media print)
 * so that html2canvas renders it correctly
 */
function generatePrintReadyHtml(originalHtml: string): string {
  // Extract the body content and inject inline styles that html2canvas will actually render
  // html2canvas doesn't apply @media print styles, so we need to force them inline
  
  // Replace @media print blocks with regular styles - simple approach: inject override styles
  const overrideStyles = `
    <style>
      /* Force print-like styles for canvas rendering */
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        line-height: 1.2 !important;
        color: #333 !important;
        padding: 16px 24px !important;
        padding-bottom: 60px !important;
        max-width: 100% !important;
        margin: 0 !important;
        font-size: 9pt !important;
        font-weight: normal !important;
        background: white !important;
      }
      
      .print-header {
        border-bottom: 2px solid #1a56db !important;
        padding-bottom: 8px !important;
        margin-bottom: 12px !important;
      }
      
      .print-title {
        font-size: 18pt !important;
        font-weight: bold !important;
        margin-bottom: 6px !important;
        color: #1a56db !important;
        text-decoration: underline !important;
      }
      
      .print-meta {
        font-size: 7pt !important;
        color: #666 !important;
        margin-bottom: 6px !important;
        font-weight: normal !important;
      }
      
      .print-category {
        display: inline-block !important;
        font-size: 7pt !important;
        background-color: #dbeafe !important;
        color: #1e40af !important;
        padding: 1px 6px !important;
        border-radius: 4px !important;
        margin-right: 6px !important;
        font-weight: 500 !important;
      }
      
      .print-tags {
        margin-bottom: 8px !important;
      }
      
      .print-tag {
        display: inline-block !important;
        font-size: 6pt !important;
        background-color: #e0e7ff !important;
        color: #3730a3 !important;
        padding: 1px 4px !important;
        border-radius: 4px !important;
        margin-right: 3px !important;
        font-weight: normal !important;
      }
      
      .print-content {
        font-size: 9pt !important;
        margin-bottom: 12px !important;
        font-weight: normal !important;
        line-height: 1.3 !important;
      }
      
      .print-content p {
        font-weight: normal !important;
        margin-top: 0 !important;
        margin-bottom: 5px !important;
        font-size: 9pt !important;
        line-height: 1.3 !important;
      }
      
      .print-content h1 {
        font-size: 14pt !important;
        font-weight: bold !important;
        margin-top: 14px !important;
        margin-bottom: 8px !important;
        color: #1e3a5f !important;
        border-bottom: 1px solid #ccc !important;
        padding-bottom: 3px !important;
      }
      
      .print-content h2 {
        font-size: 12pt !important;
        font-weight: bold !important;
        margin-top: 12px !important;
        margin-bottom: 6px !important;
        color: #2c4a6e !important;
      }
      
      .print-content h3 {
        font-size: 10pt !important;
        font-weight: 600 !important;
        margin-top: 10px !important;
        margin-bottom: 5px !important;
        color: #374151 !important;
      }
      
      .print-content ul, .print-content ol {
        padding-left: 18px !important;
        margin: 5px 0 !important;
      }
      
      .print-content li {
        margin-bottom: 2px !important;
        font-size: 9pt !important;
        line-height: 1.3 !important;
      }
      
      .print-content strong, .print-content b {
        font-weight: bold !important;
      }
      
      .print-summary {
        background-color: #f0f9ff !important;
        border: 1px solid #bae6fd !important;
        border-radius: 6px !important;
        padding: 8px 12px !important;
        margin-bottom: 12px !important;
      }
      
      .print-summary-header {
        font-weight: bold !important;
        color: #0369a1 !important;
        margin-bottom: 5px !important;
        font-size: 8pt !important;
      }
      
      .print-summary-content {
        font-size: 8pt !important;
        line-height: 1.3 !important;
      }
      
      .print-conclusion {
        background-color: #f0fdf4 !important;
        border: 1px solid #86efac !important;
        border-radius: 6px !important;
        padding: 8px 12px !important;
        margin-top: 12px !important;
        margin-bottom: 40px !important;
      }
      
      .print-conclusion-header {
        font-weight: bold !important;
        color: #15803d !important;
        margin-bottom: 5px !important;
      }
      
      .print-footer {
        display: none !important;
      }
    </style>
  `;
  
  // Insert override styles right before </head>
  return originalHtml.replace('</head>', overrideStyles + '</head>');
}

/**
 * Converts HTML content to a PDF blob using html2canvas and pdf-lib
 */
async function htmlToPdf(html: string): Promise<Blob> {
  // Transform HTML to have proper print styles for canvas rendering
  const printReadyHtml = generatePrintReadyHtml(html);
  
  // Create hidden iframe with content - use auto height to capture all content
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.width = "794px"; // A4 width at 96 DPI
  iframe.style.height = "auto"; // Let it expand to fit content
  iframe.style.minHeight = "1123px"; // At least one A4 page
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Failed to access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(printReadyHtml);
  iframeDoc.close();

  // Wait for content to render and fonts to load
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get the actual content height
  const body = iframeDoc.body;
  if (!body) {
    document.body.removeChild(iframe);
    throw new Error("No body found in iframe");
  }

  // Force the iframe to match content height
  const contentHeight = Math.max(body.scrollHeight, body.offsetHeight, 1123);
  iframe.style.height = `${contentHeight}px`;

  // Wait a bit more after resizing
  await new Promise((resolve) => setTimeout(resolve, 300));

  const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} (timeout ${ms}ms)`)), ms)
    );
    return Promise.race([p, timeout]);
  };

  // Render to canvas - capture the entire body from the top
  const canvas = await withTimeout(
    html2canvas(body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      height: contentHeight,
      windowWidth: 794,
      windowHeight: contentHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    }),
    30_000,
    "Falha a renderizar a nota para PDF"
  );

  document.body.removeChild(iframe);

  // Create PDF from canvas
  const pdfDoc = await PDFDocument.create();

  // Page dimensions with margins
  const pageWidth = 595.28; // A4 in points
  const pageHeight = 841.89; // A4 in points
  const marginTop = 30;
  const marginBottom = 80; // Footer space
  const usableHeight = pageHeight - marginTop - marginBottom;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Scale to fit page width
  const scale = pageWidth / imgWidth;
  const scaledHeight = imgHeight * scale;

  // Calculate pages based on usable height
  const pagesCount = Math.ceil(scaledHeight / usableHeight);

  // Source pixels per PDF page
  const sourceHeightPerPage = imgHeight / pagesCount;

  for (let i = 0; i < pagesCount; i++) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate source coordinates
    const sourceY = Math.round(i * sourceHeightPerPage);
    const nextSourceY = Math.round((i + 1) * sourceHeightPerPage);
    const sourceHeight = Math.min(nextSourceY - sourceY, imgHeight - sourceY);

    if (sourceHeight <= 0) continue;

    // Create a canvas for this page section
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = imgWidth;
    pageCanvas.height = sourceHeight;

    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        imgWidth,
        sourceHeight,
        0,
        0,
        imgWidth,
        sourceHeight
      );

      const imageDataUrl = pageCanvas.toDataURL("image/png");
      const pngBytes = await fetch(imageDataUrl).then((res) => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngBytes);

      // Calculate draw height maintaining aspect ratio
      const drawHeight = sourceHeight * scale;
      
      page.drawImage(pngImage, {
        x: 0,
        y: marginBottom, // Leave footer space at bottom
        width: pageWidth,
        height: drawHeight,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  // Ensure we pass a real ArrayBuffer (not SharedArrayBuffer) for strict DOM typings
  const ab = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(ab).set(pdfBytes);
  return new Blob([ab], { type: "application/pdf" });
}

/**
 * Gets filename from URL
 */
function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || 'attachment.pdf';
  } catch {
    return url.split('/').pop() || 'attachment.pdf';
  }
}

/**
 * Handles printing a note
 */
export const printNote = (noteData: Partial<Note>): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    console.error('Could not open print window - popup blocker?');
    return;
  }
  
  // Process summary if it exists to handle potential JSON format
  let processedSummary = noteData.summary;
  if (processedSummary) {
    try {
      // Try to parse as JSON in case it's stored that way
      const parsedSummary = JSON.parse(processedSummary);
      if (parsedSummary && typeof parsedSummary === 'object' && parsedSummary.summary) {
        processedSummary = parsedSummary.summary;
      }
    } catch (e) {
      // Not JSON, use as-is
      processedSummary = noteData.summary;
    }
  }
  
  // Normalize content to fix font weight issues
  let normalizedContent = noteData.content ? normalizeContent(noteData.content) : '';
  
  // Check if this is a vacation note and apply special formatting
  const isVacationNote = noteData.category === 'Vacations' || noteData.category === 'Vacation';
  
  if (isVacationNote) {
    // Process vacation content to center text and enhance formatting
    normalizedContent = enhanceVacationContent(normalizedContent);
  }

  // Ensure we have a valid title
  const noteTitle = noteData.title ? noteData.title.trim() : "Untitled Note";
  console.log("Printing note with title:", noteTitle);
  
  // Create a complete Note object with default values for required properties
  const note: Note = {
    id: "temp-print-id",
    title: noteTitle,
    content: normalizedContent,
    tags: noteData.tags || [],
    category: noteData.category || "Uncategorized",
    createdAt: noteData.createdAt || new Date(),
    updatedAt: noteData.updatedAt || new Date(),
    attachment_url: noteData.attachment_url,
    summary: processedSummary,
    tradeInfo: noteData.tradeInfo
  };
  
  // Generate the HTML content
  const printContent = generatePrintHtml(note);
  
  // Write the content to the new window and trigger printing
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for images to load before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      
      // Close the window after printing (some browsers may do this automatically)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 500);
    }, isVacationNote ? 1500 : 1000); // Allow more time for vacation photos to load
  };
};

/**
 * Handles printing a note with all PDF attachments merged into one document
 *
 * Requested behavior: do the merge first, then open the print window.
 * (This avoids leaving users stuck on an about:blank status page.)
 */
export const printNoteWithAttachments = async (
  noteData: Partial<Note>,
  attachments: string[],
  onProgress?: (message: string) => void
): Promise<void> => {
  const progress = (m: string) => {
    console.log("printNoteWithAttachments:", m);
    onProgress?.(m);
  };

  console.log("printNoteWithAttachments: ENTER", {
    title: noteData.title,
    attachmentsCount: attachments?.length ?? 0,
    attachmentsSample: attachments?.slice(0, 2),
  });

  progress("A preparar o PDF combinado…");

  // Filter for PDF attachments only
  const pdfAttachments = (attachments || []).filter((url) => url && isPdfUrl(url));

  if (pdfAttachments.length === 0) {
    toast.warning("Não existem anexos PDF para combinar");
    printNote(noteData);
    return;
  }

  // Watchdog: if something hangs, show a useful hint
  const watchdog = window.setTimeout(() => {
    progress(
      "Isto está a demorar mais do que o esperado. Se os anexos forem grandes/protegidos, pode demorar."
    );
  }, 45_000);

  let blobUrl: string | null = null;

  try {
    progress("A gerar PDF da nota…");

    // Process note content (same as printNote)
    let processedSummary = noteData.summary;
    if (processedSummary) {
      try {
        const parsedSummary = JSON.parse(processedSummary);
        if (parsedSummary && typeof parsedSummary === "object" && parsedSummary.summary) {
          processedSummary = parsedSummary.summary;
        }
      } catch {
        // Not JSON, use as-is
      }
    }

    let normalizedContent = noteData.content ? normalizeContent(noteData.content) : "";
    const isVacationNote = noteData.category === "Vacations" || noteData.category === "Vacation";

    if (isVacationNote) {
      normalizedContent = enhanceVacationContent(normalizedContent);
    }

    const noteTitle = noteData.title ? noteData.title.trim() : "Untitled Note";

    const note: Note = {
      id: "temp-print-id",
      title: noteTitle,
      content: normalizedContent,
      tags: noteData.tags || [],
      category: noteData.category || "Uncategorized",
      createdAt: noteData.createdAt || new Date(),
      updatedAt: noteData.updatedAt || new Date(),
      attachment_url: noteData.attachment_url,
      summary: processedSummary,
      tradeInfo: noteData.tradeInfo,
    };

    // Generate HTML and convert to PDF
    const printContent = generatePrintHtml(note);
    const notePdfBlob = await htmlToPdf(printContent);

    progress("A combinar PDFs…");

    const pdfSources = [
      { blob: notePdfBlob, name: "Nota" },
      ...pdfAttachments.map((url) => ({ url, name: getFilenameFromUrl(url) })),
    ];

    const mergedBlob = await mergeMultiplePdfs(pdfSources, progress);
    blobUrl = URL.createObjectURL(mergedBlob);

    // Print without navigating a new tab to a blob: URL (some extensions block it as ERR_BLOCKED_BY_CLIENT).
    // We keep the pre-opened status window only for user feedback, then print via a hidden iframe.
    const statusWindow =
      reservedPrintWindow && !reservedPrintWindow.closed ? reservedPrintWindow : null;
    reservedPrintWindow = null;

    const downloadMergedPdf = () => {
      if (!blobUrl) return;
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${noteTitle || "nota"}-com-anexos.pdf`;
      a.rel = "noopener";
      a.click();
    };

    if (statusWindow) {
      updatePrintWindowStatus(statusWindow, "PDF combinado pronto. A imprimir…");
    }

    progress("PDF combinado pronto. A imprimir…");

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;

    let finished = false;

    const cleanup = () => {
      try {
        iframe.remove();
      } catch {
        // ignore
      }
      if (statusWindow && !statusWindow.closed) {
        try {
          statusWindow.close();
        } catch {
          // ignore
        }
      }
    };

    const fallbackToDownload = () => {
      if (finished) return;
      finished = true;
      toast.error("O Chrome/uma extensão bloqueou a pré-visualização. A transferir o PDF…");
      downloadMergedPdf();
      cleanup();
    };

    iframe.onload = () => {
      if (finished) return;
      try {
        const w = iframe.contentWindow;
        if (!w) throw new Error("no iframe window");
        w.focus();
        w.print();
        finished = true;
        toast.success(
          `PDF combinado pronto (${pdfAttachments.length} anexo${pdfAttachments.length > 1 ? "s" : ""})`
        );
        setTimeout(cleanup, 800);
      } catch {
        fallbackToDownload();
      }
    };

    document.body.appendChild(iframe);

    // Safety timeout: if the iframe never loads (blocked), fallback to download.
    setTimeout(() => {
      if (!finished) fallbackToDownload();
    }, 2500);

  } catch (error) {
    console.error("Error printing with attachments:", error);
    const message = error instanceof Error ? error.message : String(error);
    toast.error(message || "Erro ao combinar PDFs");
  } finally {
    window.clearTimeout(watchdog);
    if (blobUrl) {
      setTimeout(() => URL.revokeObjectURL(blobUrl!), 60_000);
    }
  }
};
