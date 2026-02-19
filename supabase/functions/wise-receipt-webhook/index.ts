import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Merges two PDFs (original document + Wise receipt) into one.
 * Returns the merged PDF as Uint8Array, or null if merge fails.
 */
async function mergePdfs(
  supabase: ReturnType<typeof createClient>,
  originalUrl: string,
  receiptBytes: Uint8Array
): Promise<Uint8Array | null> {
  try {
    // Download original PDF from Supabase storage
    const storageMatch = originalUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    let originalBytes: ArrayBuffer;

    if (storageMatch) {
      const [, bucket, encodedPath] = storageMatch;
      const filePath = decodeURIComponent(encodedPath.split('?')[0]);
      const { data, error } = await supabase.storage.from(bucket).download(filePath);
      if (error || !data) {
        console.error('Failed to download original PDF:', error);
        return null;
      }
      originalBytes = await data.arrayBuffer();
    } else {
      const resp = await fetch(originalUrl);
      if (!resp.ok) return null;
      originalBytes = await resp.arrayBuffer();
    }

    const mergedPdf = await PDFDocument.create();

    // Add original document pages
    const originalPdf = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    const origPages = await mergedPdf.copyPages(originalPdf, originalPdf.getPageIndices());
    origPages.forEach(p => mergedPdf.addPage(p));

    // Add receipt pages
    const receiptPdf = await PDFDocument.load(receiptBytes, { ignoreEncryption: true });
    const receiptPages = await mergedPdf.copyPages(receiptPdf, receiptPdf.getPageIndices());
    receiptPages.forEach(p => mergedPdf.addPage(p));

    const merged = await mergedPdf.save();
    console.log(`Merged PDF: ${origPages.length} + ${receiptPages.length} = ${mergedPdf.getPageCount()} pages`);
    return new Uint8Array(merged);
  } catch (err) {
    console.error('PDF merge failed:', err);
    return null;
  }
}

/**
 * Wise Receipt Webhook
 * 
 * Handles two types of requests:
 * 1. Wise webhook (transfers#state-change) — automatic, triggered when transfer completes
 * 2. Manual trigger — POST with { transferId } to force receipt download
 * 
 * Flow:
 * - Receives transferId (from Wise webhook or manual call)
 * - Looks up workflow_files by wise_transfer_id
 * - Downloads receipt PDF from Wise API
 * - Uploads PDF to Supabase Storage (attachments bucket)
 * - Updates workflow_files with receipt_url
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests (Wise webhook URL validation)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', service: 'wise-receipt-webhook' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Use env variable if set, otherwise fallback to hardcoded token
    // TODO: Set WISE_API_TOKEN as Supabase secret and remove fallback
    const wiseApiToken = Deno.env.get('WISE_API_TOKEN') || '59711e4a-0214-41c9-a82b-0fa726068035';

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();

    console.log('Received wise-receipt-webhook request:', JSON.stringify(body, null, 2));

    // --- Determine transferId and validate event ---
    let transferId: number;

    if (body.event_type === 'transfers#state-change') {
      // Wise webhook format
      const state = body.data?.current_state;
      console.log(`Wise webhook: transfer ${body.data?.resource?.id} state -> ${state}`);

      // Only download receipt for terminal/completed states
      const receiptStates = ['outgoing_payment_sent', 'funds_converted', 'bounced_back'];
      if (!receiptStates.includes(state)) {
        console.log(`Ignoring state: ${state}`);
        return new Response(
          JSON.stringify({ success: true, message: `State ${state} ignored, no receipt needed` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      transferId = body.data?.resource?.id;
      if (!transferId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing resource.id in Wise webhook' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (body.transferId) {
      // Manual trigger format: { transferId: 12345 }
      transferId = Number(body.transferId);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing transferId or invalid Wise webhook format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing receipt for transfer: ${transferId}`);

    // --- Look up the workflow_files record by wise_transfer_id ---
    const { data: doc, error: lookupError } = await supabase
      .from('workflow_files')
      .select('id, file_name, wise_transfer_id, receipt_url, user_id, company_id, vendor_name, total_amount, tax_amount, subtotal, file_url, invoice_date, currency, category, project_id')
      .eq('wise_transfer_id', transferId)
      .maybeSingle();

    if (lookupError) {
      console.error('Error looking up workflow_files:', lookupError);
      return new Response(
        JSON.stringify({ success: false, error: `DB lookup error: ${lookupError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!doc) {
      console.log(`No workflow_files record found for wise_transfer_id ${transferId}`);
      return new Response(
        JSON.stringify({ success: false, error: `No document found for transfer ${transferId}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if receipt already attached (unless forced)
    if (doc.receipt_url && !body.force) {
      console.log(`Receipt already attached for document ${doc.id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Receipt already attached',
          documentId: doc.id,
          receiptUrl: doc.receipt_url
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Download receipt PDF from Wise API ---
    console.log(`Downloading receipt PDF for transfer ${transferId}...`);
    const receiptResponse = await fetch(
      `https://api.wise.com/v1/transfers/${transferId}/receipt.pdf`,
      { headers: { 'Authorization': `Bearer ${wiseApiToken}` } }
    );

    if (!receiptResponse.ok) {
      const errorText = await receiptResponse.text();
      console.error(`Wise receipt download failed: ${receiptResponse.status}`, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to download receipt from Wise (${receiptResponse.status})`,
          details: errorText.substring(0, 200)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pdfBuffer = await receiptResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);
    console.log(`Downloaded receipt PDF: ${pdfBytes.length} bytes`);

    // --- Upload to Supabase Storage ---
    const userId = doc.user_id || 'system';
    const fileName = `wise-receipt-${transferId}.pdf`;
    const storagePath = `${userId}/receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(storagePath);

    console.log(`Uploaded receipt to: ${publicUrl}`);

    // --- Auto-merge: combine original document + receipt into single PDF ---
    let mergedFileUrl: string | null = null;
    if (doc.file_url && !doc.file_url.includes('payment-attachments/merged-')) {
      console.log('Auto-merging original document with Wise receipt...');
      const mergedBytes = await mergePdfs(supabase, doc.file_url, pdfBytes);
      if (mergedBytes) {
        const mergedPath = `payment-attachments/merged-${transferId}.pdf`;
        const { error: mergeUploadError } = await supabase.storage
          .from('company-documents')
          .upload(mergedPath, mergedBytes, { contentType: 'application/pdf', upsert: true });

        if (!mergeUploadError) {
          const { data: mergedUrlData } = supabase.storage
            .from('company-documents')
            .getPublicUrl(mergedPath);
          mergedFileUrl = mergedUrlData.publicUrl;
          console.log(`Merged PDF uploaded: ${mergedFileUrl}`);
        } else {
          console.error('Failed to upload merged PDF:', mergeUploadError);
        }
      }
    } else {
      console.log('Document already merged or no original URL, skipping auto-merge');
    }

    // --- Update workflow_files with receipt URL (and merged file_url if available) ---
    const updateData: Record<string, unknown> = {
      receipt_url: publicUrl,
      status: 'Payment',
      updated_at: new Date().toISOString(),
    };
    if (mergedFileUrl) {
      updateData.file_url = mergedFileUrl;
    }

    const { error: updateError } = await supabase
      .from('workflow_files')
      .update(updateData)
      .eq('id', doc.id);

    if (updateError) {
      console.error('Error updating workflow_files:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: `DB update failed: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully attached receipt for document ${doc.id}`);

    // --- Auto-create financial_transaction if none exists (fallback) ---
    const { data: existingTx } = await supabase
      .from('financial_transactions')
      .select('id')
      .or(`document_file_id.eq.${doc.id},invoice_file_url.eq.${doc.file_url}`)
      .maybeSingle();

    if (!existingTx && doc.company_id && doc.total_amount) {
      // Find a Wise bank account
      const { data: wiseAccount } = await supabase
        .from('bank_accounts')
        .select('id')
        .ilike('account_name', '%wise%')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const catMap: Record<string, string> = {
        'Handling': 'services', 'Combustível': 'materials', 'Manutenção': 'services',
        'Electricidade': 'utilities', 'Electricidade-Agua': 'utilities',
        'Software': 'services', 'Impostos': 'taxes', 'Salários': 'salaries',
      };
      const removeExt = (n: string) => { const d = n.lastIndexOf('.'); return d > 0 ? n.substring(0, d) : n; };

      const { error: txError } = await supabase
        .from('financial_transactions')
        .insert({
          company_id: doc.company_id,
          type: 'expense',
          category: catMap[doc.category || ''] || 'services',
          date: doc.invoice_date || new Date().toISOString().split('T')[0],
          description: `Pagamento Wise: ${removeExt(doc.file_name)}`,
          entity_name: doc.vendor_name || 'Fornecedor',
          total_amount: doc.total_amount,
          amount_net: doc.subtotal || doc.total_amount,
          vat_amount: doc.tax_amount || 0,
          vat_rate: doc.tax_amount && doc.subtotal
            ? Math.round((doc.tax_amount / doc.subtotal) * 100)
            : 0,
          payment_method: 'bank_transfer',
          bank_account_id: wiseAccount?.id || null,
          invoice_file_url: mergedFileUrl || doc.file_url,
          document_file_id: doc.id,
          created_by: doc.user_id,
          project_id: doc.project_id || null,
        });

      if (txError) {
        console.error('Error creating financial_transaction via receipt webhook:', txError);
      } else {
        console.log(`Auto-created financial_transaction for document ${doc.id} via receipt webhook`);
      }
    } else if (existingTx && mergedFileUrl) {
      // Update existing transaction with merged URL
      await supabase
        .from('financial_transactions')
        .update({ invoice_file_url: mergedFileUrl })
        .eq('id', existingTx.id);
      console.log(`Updated financial_transaction ${existingTx.id} with merged URL`);
    } else if (existingTx) {
      console.log(`Financial transaction already exists for document ${doc.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Receipt downloaded and attached successfully',
        documentId: doc.id,
        transferId: transferId,
        receiptUrl: publicUrl,
        fileName: fileName,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in wise-receipt-webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
