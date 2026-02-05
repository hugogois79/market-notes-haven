import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName, mimeType } = await req.json();

    console.log('Received legal document analysis request:', { fileName, mimeType });

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'file_url_missing',
          message: 'URL do ficheiro não fornecida.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_LEGAL_DOC_ANALYSIS_WEBHOOK');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_LEGAL_DOC_ANALYSIS_WEBHOOK not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'N8N webhook not configured',
          message: 'Configure N8N_LEGAL_DOC_ANALYSIS_WEBHOOK secret' 
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
        source: 'legal-document',
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
          message: 'O workflow n8n encontrou um erro.'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
    }

    const extractedData = n8nResult?.data || n8nResult;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document analysis completed',
        data: extractedData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-legal-document:', error);
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
