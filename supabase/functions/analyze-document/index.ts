import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { fileContent, fileName } = await req.json();

    if (!fileContent) {
      throw new Error('No file content provided');
    }

    console.log(`Analyzing document: ${fileName}`);

    const systemPrompt = `You are a financial document analyzer. Analyze the provided document content and determine if it is:
1. A LOAN document (empréstimo) - contracts, loan agreements, credit agreements
2. A TRANSACTION document (transação/movimento) - invoices, receipts, payment confirmations, bank statements
3. UNKNOWN - if you cannot determine the type

Respond in JSON format with the following structure:
{
  "documentType": "loan" | "transaction" | "unknown",
  "confidence": number between 0 and 1,
  "summary": "brief description of the document",
  "extractedData": {
    // For loans:
    "amount": number or null,
    "interestRate": number or null,
    "startDate": "YYYY-MM-DD" or null,
    "endDate": "YYYY-MM-DD" or null,
    "lender": "string" or null,
    "borrower": "string" or null,
    
    // For transactions:
    "amount": number or null,
    "date": "YYYY-MM-DD" or null,
    "entityName": "string" or null,
    "description": "string" or null,
    "transactionType": "income" | "expense" | null,
    "invoiceNumber": "string" or null
  },
  "reasoning": "explanation of why you classified it this way"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this document:\n\nFilename: ${fileName}\n\nContent:\n${fileContent.substring(0, 15000)}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON from the response
    let analysis;
    try {
      // Try to extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a default analysis if parsing fails
      analysis = {
        documentType: "unknown",
        confidence: 0,
        summary: "Could not analyze document",
        extractedData: {},
        reasoning: "Failed to parse AI response"
      };
    }

    console.log('Document analysis result:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
