import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, storagePath, fileName, mimeType, cardId, attachmentId } = await req.json();

    console.log('Received kanban attachment analysis request:', { fileName, mimeType, cardId, storagePath, fileUrl });

    // Initialize Supabase client with service role for storage and database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine storage path - use new field or extract from URL
    let filePath = storagePath;
    if (!filePath && fileUrl) {
      const match = fileUrl.match(/\/storage\/v1\/object\/public\/kanban-attachments\/(.+)$/);
      if (match) {
        filePath = decodeURIComponent(match[1]);
      }
    }

    console.log('Using storage path:', filePath);

    if (!filePath) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'storage_path_missing',
          message: 'Não foi possível determinar o caminho do ficheiro no storage.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // VALIDATION: Check if file exists in storage before proceeding
    console.log('Checking if file exists in storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('kanban-attachments')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('File not found in storage:', downloadError);
      
      // AUTO-CLEANUP: Delete orphaned database record
      if (attachmentId) {
        console.log('Deleting orphaned attachment record:', attachmentId);
        const { error: deleteError } = await supabase
          .from('kanban_attachments')
          .delete()
          .eq('id', attachmentId);
        
        if (deleteError) {
          console.error('Error deleting orphaned record:', deleteError);
        } else {
          console.log('Orphaned record deleted successfully');
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'file_not_found',
          orphanCleaned: !!attachmentId,
          message: 'O ficheiro não existe no storage. O registo órfão foi removido automaticamente.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('File exists in storage, generating signed URL...');

    // Generate signed URL (valid for 1 hour) - file confirmed to exist
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('kanban-attachments')
      .createSignedUrl(filePath, 3600); // 1 hour validity

    if (signedError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'signed_url_failed',
          message: 'Não foi possível gerar URL de acesso ao ficheiro.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const accessibleUrl = signedUrlData.signedUrl;
    console.log('Generated signed URL successfully');

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_KANBAN_DOC_SUMMARY_WEBHOOK');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_KANBAN_DOC_SUMMARY_WEBHOOK not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'N8N webhook not configured',
          message: 'Configure N8N_KANBAN_DOC_SUMMARY_WEBHOOK secret' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Forward request to n8n webhook with accessible signed URL
    console.log('Forwarding to n8n webhook:', n8nWebhookUrl);
    
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl: accessibleUrl,
        fileName,
        mimeType,
        cardId,
        source: 'kanban-attachment',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook error:', n8nResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `n8n processing error (${n8nResponse.status})`,
          details: errorText,
          message: 'O workflow n8n encontrou um erro. Verifique a configuração do workflow.'
        }),
        { 
          status: 200, // Return 200 to frontend with error info
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle n8n response
    let n8nResult = null;
    const responseText = await n8nResponse.text();
    if (responseText && responseText.trim()) {
      try {
        n8nResult = JSON.parse(responseText);
        console.log('n8n response:', n8nResult);
      } catch {
        console.log('n8n returned non-JSON response:', responseText);
        n8nResult = { message: responseText };
      }
    } else {
      console.log('n8n returned empty response (async processing)');
    }

    // Extract the data from n8n response
    const extractedData = n8nResult?.data || n8nResult;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: n8nResult ? 'Document analysis received' : 'Document sent to n8n for async analysis',
        data: extractedData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-kanban-attachment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
