import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Merge Wise Receipts — Batch Job
 * 
 * Finds all workflow_files that have a receipt_url (Wise receipt downloaded)
 * but whose file_url has NOT been merged yet, and merges them.
 * 
 * Designed to be called on a schedule (every 5 min, 8h-23h).
 * Can also be called manually via POST.
 */

async function downloadFromStorage(
  supabase: ReturnType<typeof createClient>,
  url: string
): Promise<ArrayBuffer | null> {
  const storageMatch = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  if (storageMatch) {
    const [, bucket, encodedPath] = storageMatch;
    const filePath = decodeURIComponent(encodedPath.split('?')[0]);
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error || !data) {
      console.error(`Failed to download from ${bucket}/${filePath}:`, error);
      return null;
    }
    return data.arrayBuffer();
  }
  // External URL fallback
  const resp = await fetch(url);
  if (!resp.ok) return null;
  return resp.arrayBuffer();
}

async function mergeTwoPdfs(
  originalBytes: ArrayBuffer,
  receiptBytes: ArrayBuffer
): Promise<Uint8Array | null> {
  try {
    const mergedPdf = await PDFDocument.create();

    const originalPdf = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    const origPages = await mergedPdf.copyPages(originalPdf, originalPdf.getPageIndices());
    origPages.forEach(p => mergedPdf.addPage(p));

    const receiptPdf = await PDFDocument.load(receiptBytes, { ignoreEncryption: true });
    const receiptPages = await mergedPdf.copyPages(receiptPdf, receiptPdf.getPageIndices());
    receiptPages.forEach(p => mergedPdf.addPage(p));

    return new Uint8Array(await mergedPdf.save());
  } catch (err) {
    console.error('PDF merge failed:', err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find documents with receipt_url but not yet merged
    // Merged files have URLs containing 'payment-attachments/merged-'
    const { data: pendingDocs, error: queryError } = await supabase
      .from('workflow_files')
      .select('id, file_name, file_url, receipt_url, wise_transfer_id')
      .not('receipt_url', 'is', null)
      .not('file_url', 'ilike', '%payment-attachments/merged-%')
      .limit(10); // Process max 10 per run to stay within edge function timeout

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingDocs || pendingDocs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No documents pending merge', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingDocs.length} documents to merge`);

    const results: Array<{ id: string; fileName: string; status: string; error?: string }> = [];

    for (const doc of pendingDocs) {
      try {
        console.log(`Merging: ${doc.file_name} (transfer: ${doc.wise_transfer_id})`);

        const originalBytes = await downloadFromStorage(supabase, doc.file_url);
        if (!originalBytes) {
          results.push({ id: doc.id, fileName: doc.file_name, status: 'error', error: 'Failed to download original' });
          continue;
        }

        const receiptBytes = await downloadFromStorage(supabase, doc.receipt_url);
        if (!receiptBytes) {
          results.push({ id: doc.id, fileName: doc.file_name, status: 'error', error: 'Failed to download receipt' });
          continue;
        }

        const mergedBytes = await mergeTwoPdfs(originalBytes, receiptBytes);
        if (!mergedBytes) {
          results.push({ id: doc.id, fileName: doc.file_name, status: 'error', error: 'PDF merge failed' });
          continue;
        }

        // Upload merged PDF
        const mergedPath = `payment-attachments/merged-${doc.wise_transfer_id || doc.id}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(mergedPath, mergedBytes, { contentType: 'application/pdf', upsert: true });

        if (uploadError) {
          results.push({ id: doc.id, fileName: doc.file_name, status: 'error', error: uploadError.message });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('company-documents')
          .getPublicUrl(mergedPath);

        // Update workflow_files with merged URL
        await supabase
          .from('workflow_files')
          .update({ file_url: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq('id', doc.id);

        // Update financial_transaction if exists
        await supabase
          .from('financial_transactions')
          .update({ invoice_file_url: urlData.publicUrl })
          .eq('document_file_id', doc.id);

        results.push({ id: doc.id, fileName: doc.file_name, status: 'merged' });
        console.log(`Successfully merged: ${doc.file_name}`);
      } catch (docError) {
        const errMsg = docError instanceof Error ? docError.message : 'Unknown error';
        results.push({ id: doc.id, fileName: doc.file_name, status: 'error', error: errMsg });
        console.error(`Error processing ${doc.file_name}:`, docError);
      }
    }

    const merged = results.filter(r => r.status === 'merged').length;
    const failed = results.filter(r => r.status === 'error').length;

    console.log(`Batch complete: ${merged} merged, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} documents: ${merged} merged, ${failed} failed`,
        processed: results.length,
        merged,
        failed,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in merge-wise-receipts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
