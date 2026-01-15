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
    const { fileUrl, fileName, mimeType, documentId, companyId, bucket = 'company-documents' } = await req.json();

    console.log('Received document analysis request:', { fileName, mimeType, documentId, companyId, fileUrl });

    // Initialize Supabase client with service role for signed URL generation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extract bucket name and file path from public URL
    // URL format: .../storage/v1/object/public/bucket-name/path/to/file.pdf
    let filePath = '';
    let detectedBucket = bucket;
    if (fileUrl) {
      const match = fileUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (match) {
        detectedBucket = match[1]; // Extract actual bucket name from URL
        filePath = decodeURIComponent(match[2]);
      }
    }

    console.log('Extracted bucket:', detectedBucket, 'file path:', filePath);

    // Generate signed URL (valid for 1 hour) - this URL is accessible even for private buckets
    let accessibleUrl = fileUrl;
    if (filePath) {
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from(detectedBucket)
        .createSignedUrl(filePath, 3600); // 1 hour validity

      if (signedError) {
        console.error('Error creating signed URL:', signedError);
        // Fall back to original URL if signed URL fails
      } else if (signedUrlData?.signedUrl) {
        accessibleUrl = signedUrlData.signedUrl;
        console.log('Generated signed URL successfully');
      }
    }

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_ANALYZE_DOCUMENT_WEBHOOK');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_ANALYZE_DOCUMENT_WEBHOOK not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'N8N webhook not configured',
          message: 'Configure N8N_ANALYZE_DOCUMENT_WEBHOOK secret' 
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
        fileUrl: accessibleUrl, // Signed URL that n8n can access
        fileName,
        mimeType,
        documentId,
        companyId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook error:', n8nResponse.status, errorText);
      
      // Return error details instead of throwing - let frontend handle gracefully
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

    // Handle n8n response - may be empty if processing async
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: n8nResult ? 'Document analysis received' : 'Document sent to n8n for async analysis',
        data: n8nResult 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-document-webhook:', error);
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
