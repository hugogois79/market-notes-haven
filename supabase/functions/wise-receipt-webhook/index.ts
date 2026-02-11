import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      .select('id, file_name, wise_transfer_id, receipt_url, user_id')
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

    // --- Update workflow_files with receipt URL ---
    const { error: updateError } = await supabase
      .from('workflow_files')
      .update({ 
        receipt_url: publicUrl,
        status: 'Payment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id);

    if (updateError) {
      console.error('Error updating workflow_files:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: `DB update failed: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully attached receipt for document ${doc.id}`);

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
