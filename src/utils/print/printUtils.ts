
import { Note } from "@/types";
import { generatePrintHtml } from "./htmlGenerator";
import { normalizeContent } from "./styles/normalizeStyles";
import { enhanceVacationContent } from "./vacationEnhancer";
import { mergeMultiplePdfs, isPdfUrl } from "../pdfMerger";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";

/**
 * Converts HTML content to a PDF blob using html2canvas and pdf-lib
 */
async function htmlToPdf(html: string): Promise<Blob> {
  // Create hidden iframe with content
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '794px'; // A4 width at 96 DPI
  iframe.style.height = '1123px'; // A4 height at 96 DPI
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to access iframe document');
  }
  
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();
  
  // Wait for content to render
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const body = iframeDoc.body;
  if (!body) {
    document.body.removeChild(iframe);
    throw new Error('No body found in iframe');
  }
  
  // Render to canvas
  const canvas = await html2canvas(body, {
    scale: 2, // Higher quality
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    windowWidth: 794,
  });
  
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
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidth;
    pageCanvas.height = Math.min(pageHeight / scale, imgHeight - (i * (pageHeight / scale)));
    
    const ctx = pageCanvas.getContext('2d');
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
      
      const imageDataUrl = pageCanvas.toDataURL('image/png');
      const pngBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
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
  return new Blob([pdfBytes], { type: 'application/pdf' });
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
  // IMPORTANT: open a window synchronously to avoid popup blockers
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error("O browser bloqueou a janela de impressão (popup blocker)");
    return;
  }

  // Basic placeholder while we prepare the PDF
  try {
    printWindow.document.open();
    printWindow.document.write(
      `<!doctype html><html><head><title>A preparar impressão…</title></head><body style="font-family: system-ui; padding: 24px;">A preparar o PDF combinado…</body></html>`
    );
    printWindow.document.close();
  } catch {
    // ignore
  }

  // Filter for PDF attachments only
  const pdfAttachments = attachments.filter((url) => url && isPdfUrl(url));

  if (pdfAttachments.length === 0) {
    toast.warning("Não existem anexos PDF para combinar");
    // fallback: print note only (this will open another tab; so instead reuse current tab)
    try {
      printWindow.close();
    } catch {
      // ignore
    }
    printNote(noteData);
    return;
  }

  let blobUrl: string | null = null;

  try {
    onProgress?.("A gerar PDF da nota...");
    toast.info("A preparar documento combinado...");

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

    onProgress?.("A combinar PDFs...");

    const pdfSources = [
      { blob: notePdfBlob, name: "Nota" },
      ...pdfAttachments.map((url) => ({ url, name: getFilenameFromUrl(url) })),
    ];

    const mergedBlob = await mergeMultiplePdfs(pdfSources, onProgress);

    blobUrl = URL.createObjectURL(mergedBlob);

    // Navigate the already-open window to the blob URL
    printWindow.location.href = blobUrl;

    toast.success(
      `PDF combinado pronto (${pdfAttachments.length} anexo${pdfAttachments.length > 1 ? "s" : ""})`
    );

    // Trigger print after the PDF loads
    const onLoad = () => {
      // Some browsers need a small delay
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // ignore
        }
      }, 300);
    };

    // Best-effort: attach load handler
    try {
      printWindow.addEventListener?.("load", onLoad);
    } catch {
      // ignore
    }

    // Fallback in case load event doesn't fire
    setTimeout(onLoad, 1200);

  } catch (error) {
    console.error("Error printing with attachments:", error);
    toast.error("Erro ao combinar PDFs. A imprimir apenas a nota...");
    try {
      printWindow.close();
    } catch {
      // ignore
    }
    printNote(noteData);
  } finally {
    if (blobUrl) {
      setTimeout(() => URL.revokeObjectURL(blobUrl!), 60_000);
    }
  }
};
