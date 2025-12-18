import { PDFDocument } from 'pdf-lib';

/**
 * Fetches a PDF from a URL and returns its ArrayBuffer
 */
async function fetchPdfAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from ${url}`);
  }
  return response.arrayBuffer();
}

/**
 * Merges two PDFs: the original document (invoice) first, then the payment document second
 * @param originalPdfUrl - URL of the original invoice/document PDF
 * @param paymentPdfFile - The payment document File object to append
 * @returns A Blob of the merged PDF
 */
export async function mergePdfs(
  originalPdfUrl: string,
  paymentPdfFile: File
): Promise<Blob> {
  // Create a new PDF document
  const mergedPdf = await PDFDocument.create();

  // Load the original PDF from URL
  const originalPdfBytes = await fetchPdfAsArrayBuffer(originalPdfUrl);
  const originalPdf = await PDFDocument.load(originalPdfBytes);
  
  // Copy all pages from the original PDF
  const originalPages = await mergedPdf.copyPages(originalPdf, originalPdf.getPageIndices());
  originalPages.forEach((page) => mergedPdf.addPage(page));

  // Load the payment PDF from the File object
  const paymentPdfBytes = await paymentPdfFile.arrayBuffer();
  const paymentPdf = await PDFDocument.load(paymentPdfBytes);
  
  // Copy all pages from the payment PDF
  const paymentPages = await mergedPdf.copyPages(paymentPdf, paymentPdf.getPageIndices());
  paymentPages.forEach((page) => mergedPdf.addPage(page));

  // Save the merged PDF
  const mergedPdfBytes = await mergedPdf.save();
  
  return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
}

/**
 * Checks if a file is a PDF based on its mime type or extension
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Checks if a URL points to a PDF file
 */
export function isPdfUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith('.pdf');
  } catch {
    return url.toLowerCase().endsWith('.pdf');
  }
}
