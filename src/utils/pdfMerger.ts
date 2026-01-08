import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

// Custom error class for encrypted PDFs
export class EncryptedPdfError extends Error {
  constructor(message: string = 'PDF is encrypted and cannot be processed') {
    super(message);
    this.name = 'EncryptedPdfError';
  }
}

/**
 * Fetches a PDF from Supabase storage URL and returns its ArrayBuffer
 */
async function fetchPdfAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  console.log('Fetching PDF from URL:', url);

  // Try to extract the path from the Supabase storage URL
  const supabaseStorageMatch = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);

  if (supabaseStorageMatch) {
    const bucketName = supabaseStorageMatch[1];
    const filePath = supabaseStorageMatch[2];
    console.log(`Downloading from Supabase bucket: ${bucketName}, path: ${filePath}`);

    const { data, error } = await supabase.storage.from(bucketName).download(filePath);

    if (error) {
      console.error('Supabase download error:', error);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }

    return data.arrayBuffer();
  }

  // Fallback to regular fetch for external URLs
  console.log('Using regular fetch for URL');
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from ${url}: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/**
 * Loads a PDF document, failing fast for encrypted PDFs.
 */
async function loadPdfWithEncryptionHandling(pdfBytes: ArrayBuffer, source: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(pdfBytes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If encrypted, fail immediately
    if (errorMessage.toLowerCase().includes('encrypt')) {
      console.error(`PDF from ${source} is encrypted and cannot be merged`);
      throw new EncryptedPdfError(`O PDF "${source}" está protegido e não pode ser combinado`);
    }

    throw error;
  }
}

/**
 * NOTE: We intentionally do NOT attempt to "convert" encrypted/protected PDFs.
 * This keeps the TypeScript build stable and avoids heavyweight PDF.js typings.
 */

/**
 * Merges two PDFs: the original document (invoice) first, then the payment document second
 * If the original PDF is protected, tries to convert it via rendering first
 * @param originalPdfUrl - URL of the original invoice/document PDF
 * @param paymentPdfFile - The payment document File object to append
 * @param onProgress - Optional callback for conversion progress
 * @returns A Blob of the merged PDF
 */
export async function mergePdfs(
  originalPdfUrl: string,
  paymentPdfFile: File,
  onProgress?: (message: string) => void
): Promise<Blob> {
  console.log('Starting PDF merge...');
  console.log('Original PDF URL:', originalPdfUrl);
  console.log('Payment file:', paymentPdfFile.name, paymentPdfFile.size, 'bytes');

  // Create a new PDF document
  const mergedPdf = await PDFDocument.create();

  // Try to load the original PDF
  let originalPdf: PDFDocument;

  try {
    console.log('Loading original PDF...');
    const originalPdfBytes = await fetchPdfAsArrayBuffer(originalPdfUrl);
    console.log('Original PDF loaded, size:', originalPdfBytes.byteLength, 'bytes');

    originalPdf = await PDFDocument.load(originalPdfBytes);
    console.log('Original PDF parsed, pages:', originalPdf.getPageCount());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.toLowerCase().includes('encrypt')) {
      throw new EncryptedPdfError('O PDF original está protegido e não pode ser combinado');
    }

    throw error;
  }

  // Copy all pages from the original PDF
  const originalPages = await mergedPdf.copyPages(originalPdf, originalPdf.getPageIndices());
  originalPages.forEach((page) => mergedPdf.addPage(page));
  console.log('Added', originalPages.length, 'pages from original PDF');

  // Load the payment PDF from the File object
  console.log('Loading payment PDF...');
  const paymentPdfBytes = await paymentPdfFile.arrayBuffer();
  console.log('Payment PDF loaded, size:', paymentPdfBytes.byteLength, 'bytes');
  
  const paymentPdf = await loadPdfWithEncryptionHandling(paymentPdfBytes, 'comprovativo');
  console.log('Payment PDF parsed, pages:', paymentPdf.getPageCount());
  
  // Copy all pages from the payment PDF
  const paymentPages = await mergedPdf.copyPages(paymentPdf, paymentPdf.getPageIndices());
  paymentPages.forEach((page) => mergedPdf.addPage(page));
  console.log('Added', paymentPages.length, 'pages from payment PDF');

  // Save the merged PDF
  const mergedPdfBytes = await mergedPdf.save();
  console.log('Merged PDF created, total pages:', mergedPdf.getPageCount(), 'size:', mergedPdfBytes.byteLength, 'bytes');
  
  return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
}

/**
 * Merges multiple PDFs together in order
 * @param pdfSources - Array of PDF sources (URL or Blob) with names
 * @param onProgress - Optional callback for progress updates
 * @returns A Blob of the merged PDF
 */
export async function mergeMultiplePdfs(
  pdfSources: Array<{ url?: string; blob?: Blob; name: string }>,
  onProgress?: (message: string) => void
): Promise<Blob> {
  console.log('Starting multi-PDF merge with', pdfSources.length, 'sources');
  
  const mergedPdf = await PDFDocument.create();
  
  for (let i = 0; i < pdfSources.length; i++) {
    const source = pdfSources[i];
    onProgress?.(`A adicionar: ${source.name} (${i + 1}/${pdfSources.length})...`);
    
    let pdfBytes: ArrayBuffer;
    
    try {
      if (source.blob) {
        pdfBytes = await source.blob.arrayBuffer();
      } else if (source.url) {
        pdfBytes = await fetchPdfAsArrayBuffer(source.url);
      } else {
        console.warn(`Skipping source ${source.name}: no url or blob provided`);
        continue;
      }
      
      // Try to load PDF, with fallback for encrypted ones
      let pdfDoc: PDFDocument;

      try {
        pdfDoc = await PDFDocument.load(pdfBytes);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.toLowerCase().includes('encrypt')) {
          throw new EncryptedPdfError(`O PDF "${source.name}" está protegido e não pode ser combinado`);
        }

        throw error;
      }
      
      // Copy all pages to merged PDF
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
      
      console.log(`Added ${pages.length} pages from ${source.name}`);
    } catch (error) {
      console.error(`Failed to process ${source.name}:`, error);
      throw new Error(`Falha ao processar: ${source.name}`);
    }
  }
  
  const mergedBytes = await mergedPdf.save();
  console.log('Multi-PDF merge complete, total pages:', mergedPdf.getPageCount());
  
  return new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
}

// Export the fetch function for external use
export { fetchPdfAsArrayBuffer };

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
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check if pathname ends with .pdf
    if (pathname.endsWith('.pdf')) return true;
    
    // Also check if the URL contains .pdf anywhere (for Supabase storage URLs)
    if (pathname.includes('.pdf')) return true;
    
    // Check the full URL in case the extension is in a different part
    return url.toLowerCase().includes('.pdf');
  } catch {
    // Fallback for invalid URLs - just check the string
    return url.toLowerCase().includes('.pdf');
  }
}
