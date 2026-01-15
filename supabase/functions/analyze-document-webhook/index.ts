import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { fileUrl, fileName, mimeType, fileContent, documentId, companyId } = await req.json();

    console.log('Received document analysis request:', { fileName, mimeType, documentId, companyId });

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

    // Forward request to n8n webhook
    console.log('Forwarding to n8n webhook:', n8nWebhookUrl);
    
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
        fileName,
        mimeType,
        fileContent,
        documentId,
        companyId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook error:', errorText);
      throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
    }

    const n8nResult = await n8nResponse.json();
    console.log('n8n response:', n8nResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document sent to n8n for analysis',
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
