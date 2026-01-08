
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
 * Converts HTML content to a PDF blob using html2canvas and pdf-lib
 */
async function htmlToPdf(html: string): Promise<Blob> {
  // Create hidden iframe with content
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.width = "794px"; // A4 width at 96 DPI
  iframe.style.height = "1123px"; // A4 height at 96 DPI
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Failed to access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to render
  await new Promise((resolve) => setTimeout(resolve, 500));

  const body = iframeDoc.body;
  if (!body) {
    document.body.removeChild(iframe);
    throw new Error("No body found in iframe");
  }

  const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} (timeout ${ms}ms)`)), ms)
    );
    return Promise.race([p, timeout]);
  };

  // Render to canvas (can hang on some CORS/font/image cases, so guard with timeout)
  const canvas = await withTimeout(
    html2canvas(body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
    }),
    30_000,
    "Falha a renderizar a nota para PDF"
  );

  document.body.removeChild(iframe);

  // Create PDF from canvas
  const pdfDoc = await PDFDocument.create();

  // Calculate number of pages needed based on canvas height
  const pageWidth = 595.28; // A4 in points
  const pageHeight = 841.89; // A4 in points
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Scale to fit page width
  const scale = pageWidth / imgWidth;
  const scaledHeight = imgHeight * scale;

  // Calculate pages
  const pagesCount = Math.ceil(scaledHeight / pageHeight);

  for (let i = 0; i < pagesCount; i++) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Create a canvas for this page section
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = imgWidth;
    pageCanvas.height = Math.min(pageHeight / scale, imgHeight - i * (pageHeight / scale));

    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(
        canvas,
        0,
        i * (pageHeight / scale),
        imgWidth,
        pageCanvas.height,
        0,
        0,
        imgWidth,
        pageCanvas.height
      );

      const imageDataUrl = pageCanvas.toDataURL("image/png");
      const pngBytes = await fetch(imageDataUrl).then((res) => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngBytes);

      const drawHeight = pageCanvas.height * scale;
      page.drawImage(pngImage, {
        x: 0,
        y: pageHeight - drawHeight,
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
 */
export const printNoteWithAttachments = async (
  noteData: Partial<Note>,
  attachments: string[],
  onProgress?: (message: string) => void
): Promise<void> => {
  console.log("printNoteWithAttachments: ENTER", {
    title: noteData.title,
    attachmentsCount: attachments?.length ?? 0,
    attachmentsSample: attachments?.slice(0, 2),
  });

  // Get the pre-opened window or open a new one
  let printWindow = reservedPrintWindow && !reservedPrintWindow.closed
    ? reservedPrintWindow
    : null;
  reservedPrintWindow = null;

  console.log("printNoteWithAttachments: reserved window?", !!printWindow);

  // If no pre-opened window, open one now (may be blocked)
  if (!printWindow) {
    console.log("printNoteWithAttachments: opening new window");
    printWindow = window.open("", "_blank");
    if (printWindow) {
      try {
        printWindow.document.open();
        printWindow.document.write(STATUS_WINDOW_HTML);
        printWindow.document.close();
      } catch (err) {
        console.warn("printNoteWithAttachments: could not write status HTML", err);
      }
    }
  }

  if (!printWindow) {
    console.error("printNoteWithAttachments: popup blocked");
    toast.error("O browser bloqueou a janela de impressão (popup blocker)");
    return;
  }

  // Helper to update status using direct DOM manipulation (same-origin)
  const report = (message: string) => {
    console.log("printNoteWithAttachments:", message);
    onProgress?.(message);
    updatePrintWindowStatus(printWindow!, message, false);
  };

  const reportError = (message: string) => {
    console.error("printNoteWithAttachments error:", message);
    updatePrintWindowStatus(printWindow!, message, true);
  };

  // Small delay to ensure the DOM is ready after document.write
  await new Promise((r) => setTimeout(r, 100));
  report("A preparar o PDF combinado…");

  // Filter for PDF attachments only
  const pdfAttachments = attachments.filter((url) => url && isPdfUrl(url));

  if (pdfAttachments.length === 0) {
    toast.warning("Não existem anexos PDF para combinar");
    report("Não existem anexos PDF para combinar. A imprimir apenas a nota…");
    printNote(noteData);
    return;
  }

  // Watchdog: if something hangs, show a useful error in the opened tab
  const watchdog = window.setTimeout(() => {
    report(
      "Isto está a demorar mais do que o esperado. Se estiver a usar anexos grandes/protegidos, pode demorar — caso contrário, feche esta aba e tente novamente."
    );
  }, 45_000);

  let blobUrl: string | null = null;

  try {
    report("A gerar PDF da nota…");

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

    report("A combinar PDFs…");

    const pdfSources = [
      { blob: notePdfBlob, name: "Nota" },
      ...pdfAttachments.map((url) => ({ url, name: getFilenameFromUrl(url) })),
    ];

    const mergedBlob = await mergeMultiplePdfs(pdfSources, report);

    blobUrl = URL.createObjectURL(mergedBlob);
    report("PDF combinado pronto. A abrir…");

    // Navigate the already-open window to the blob URL
    printWindow.location.href = blobUrl;

    // Trigger print after the PDF loads
    const onLoad = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // ignore
        }
      }, 350);
    };

    try {
      printWindow.addEventListener?.("load", onLoad);
    } catch {
      // ignore
    }

    setTimeout(onLoad, 1400);

    toast.success(
      `PDF combinado pronto (${pdfAttachments.length} anexo${pdfAttachments.length > 1 ? "s" : ""})`
    );
  } catch (error) {
    console.error("Error printing with attachments:", error);
    const message = error instanceof Error ? error.message : String(error);
    toast.error(message || "Erro ao combinar PDFs");

    // Show the error in the print window
    reportError(`Não foi possível combinar os anexos: ${message}`);
  } finally {
    window.clearTimeout(watchdog);
    if (blobUrl) {
      setTimeout(() => URL.revokeObjectURL(blobUrl!), 60_000);
    }
  }
};
