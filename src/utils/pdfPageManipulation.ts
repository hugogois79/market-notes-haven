import { PDFDocument } from 'pdf-lib';

// Custom error class for encrypted PDFs
export class EncryptedPdfError extends Error {
  constructor(message: string = 'PDF is encrypted and cannot be processed') {
    super(message);
    this.name = 'EncryptedPdfError';
  }
}

/**
 * Converts a protected/encrypted PDF to a clean PDF by rendering each page to an image
 * and rebuilding the PDF with pdf-lib. Uses pdfjs-dist which can handle encrypted PDFs.
 */
export async function convertProtectedPdfToClean(
  pdfBytes: ArrayBuffer, 
  onProgress?: (message: string) => void
): Promise<ArrayBuffer> {
  console.log('Converting protected PDF via rendering...');
  
  // Dynamic import to avoid TypeScript issues with pdfjs-dist types
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  console.log(`Protected PDF has ${pdf.numPages} pages`);
  
  // Create new clean PDF
  const cleanPdf = await PDFDocument.create();
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`A converter página ${pageNum}/${pdf.numPages}...`);
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // High quality
    
    // Create canvas and render page
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Failed to get canvas context');
    
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    
    // Convert canvas to PNG
    const imageDataUrl = canvas.toDataURL('image/png');
    const pngResponse = await fetch(imageDataUrl);
    const pngBytes = await pngResponse.arrayBuffer();
    const pngImage = await cleanPdf.embedPng(pngBytes);
    
    // Add page with the image (scale down by 2 since we rendered at 2x)
    const pdfPage = cleanPdf.addPage([viewport.width / 2, viewport.height / 2]);
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: viewport.width / 2,
      height: viewport.height / 2
    });
  }
  
  console.log('Protected PDF converted successfully');
  const savedBytes = await cleanPdf.save();
  return savedBytes.buffer as ArrayBuffer;
}

/**
 * Load PDF with encryption handling - tries pdf-lib first, falls back to conversion
 */
async function loadPdfWithFallback(
  pdfBytes: ArrayBuffer,
  onProgress?: (message: string) => void
): Promise<{ pdfDoc: PDFDocument; wasConverted: boolean }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return { pdfDoc, wasConverted: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If encrypted, convert via rendering
    if (errorMessage.toLowerCase().includes('encrypt')) {
      console.log('PDF is encrypted, converting via rendering...');
      onProgress?.('PDF protegido detetado, a converter...');
      const cleanBytes = await convertProtectedPdfToClean(pdfBytes, onProgress);
      const pdfDoc = await PDFDocument.load(cleanBytes);
      return { pdfDoc, wasConverted: true };
    }
    
    throw error;
  }
}

/**
 * Remove uma página específica do PDF
 * @param pdfBytes - ArrayBuffer do PDF original
 * @param pageIndex - Índice da página a remover (0-based)
 * @param onProgress - Callback opcional para progresso
 * @returns ArrayBuffer do PDF modificado
 */
export async function deletePageFromPdf(
  pdfBytes: ArrayBuffer, 
  pageIndex: number,
  onProgress?: (message: string) => void
): Promise<ArrayBuffer> {
  const { pdfDoc } = await loadPdfWithFallback(pdfBytes, onProgress);
  
  if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
    throw new Error('Índice de página inválido');
  }
  
  if (pdfDoc.getPageCount() <= 1) {
    throw new Error('Não é possível eliminar a única página do documento');
  }
  
  pdfDoc.removePage(pageIndex);
  
  const modifiedBytes = await pdfDoc.save();
  return modifiedBytes.buffer as ArrayBuffer;
}

/**
 * Adiciona páginas de outro PDF ao documento atual
 * @param targetPdfBytes - PDF de destino
 * @param sourcePdfBytes - PDF de origem (de onde vêm as páginas)
 * @param sourcePageIndices - Índices das páginas a copiar (0-based)
 * @param insertAfterIndex - Inserir depois desta página (-1 para início)
 * @param onProgress - Callback opcional para progresso
 */
export async function addPagesToDocument(
  targetPdfBytes: ArrayBuffer,
  sourcePdfBytes: ArrayBuffer,
  sourcePageIndices: number[],
  insertAfterIndex: number,
  onProgress?: (message: string) => void
): Promise<ArrayBuffer> {
  onProgress?.('A carregar documentos...');
  
  const [targetResult, sourceResult] = await Promise.all([
    loadPdfWithFallback(targetPdfBytes, onProgress),
    loadPdfWithFallback(sourcePdfBytes, onProgress)
  ]);
  
  const targetDoc = targetResult.pdfDoc;
  const sourceDoc = sourceResult.pdfDoc;
  
  onProgress?.('A copiar páginas...');
  
  // Copiar páginas do documento fonte
  const copiedPages = await targetDoc.copyPages(sourceDoc, sourcePageIndices);
  
  // Inserir páginas na posição correta
  let insertAt = insertAfterIndex + 1;
  for (const page of copiedPages) {
    targetDoc.insertPage(insertAt, page);
    insertAt++;
  }
  
  onProgress?.('A guardar documento...');
  const modifiedBytes = await targetDoc.save();
  return modifiedBytes.buffer as ArrayBuffer;
}

/**
 * Get the number of pages in a PDF
 */
export async function getPdfPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  // Use pdfjs-dist for counting pages as it handles encrypted PDFs
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  return pdf.numPages;
}
