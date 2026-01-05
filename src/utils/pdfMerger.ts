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
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
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
 * Loads a PDF document, handling encrypted PDFs by trying ignoreEncryption option
 */
async function loadPdfWithEncryptionHandling(pdfBytes: ArrayBuffer, source: string): Promise<ReturnType<typeof PDFDocument.load>> {
  try {
    // First try normal load
    return await PDFDocument.load(pdfBytes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's an encryption error
    if (errorMessage.toLowerCase().includes('encrypt')) {
      console.log(`PDF from ${source} is encrypted, trying with ignoreEncryption...`);
      try {
        // Try again with ignoreEncryption option
        return await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      } catch (retryError) {
        console.error(`Failed to load encrypted PDF from ${source} even with ignoreEncryption:`, retryError);
        throw new EncryptedPdfError(`O PDF "${source}" está protegido e não pode ser processado`);
      }
    }
    
    // Re-throw non-encryption errors
    throw error;
  }
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
  console.log('Starting PDF merge...');
  console.log('Original PDF URL:', originalPdfUrl);
  console.log('Payment file:', paymentPdfFile.name, paymentPdfFile.size, 'bytes');
  
  // Create a new PDF document
  const mergedPdf = await PDFDocument.create();

  // Load the original PDF from URL
  console.log('Loading original PDF...');
  const originalPdfBytes = await fetchPdfAsArrayBuffer(originalPdfUrl);
  console.log('Original PDF loaded, size:', originalPdfBytes.byteLength, 'bytes');
  
  const originalPdf = await loadPdfWithEncryptionHandling(originalPdfBytes, 'documento base');
  console.log('Original PDF parsed, pages:', originalPdf.getPageCount());
  
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
