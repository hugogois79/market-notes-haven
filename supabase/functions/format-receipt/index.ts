import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a professional receipt formatter. Analyze the provided receipt content and extract all relevant information to create a clean, professional payment receipt in HTML format.

INSTRUCTIONS:
1. Carefully read and extract ALL information from the content
2. Identify the company/issuer information (name, address, company number, etc.)
3. Extract beneficiary details (name, position, purpose, etc.)
4. Extract payment details (date, amount, reference, bank details, etc.)
5. Format it professionally with clear sections using HTML with inline styles

OUTPUT FORMAT (HTML with inline styles):

<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- IMPORTANT: Do NOT include company header (SUSTAINABLE YIELD CAPITAL LTD) or logo in your output -->
  <!-- The header with company info on left and logo on right will be added by the app -->
  
  <!-- Title (not centered, left-aligned) -->
  <h3 style="font-size: 16px; font-weight: bold; margin: 20px 0 15px 0;">PAYMENT RECEIPT - [RECEIPT TYPE]</h3>
  
  <div style="margin: 15px 0;">
    <p style="font-weight: bold; margin: 10px 0;">Beneficiary:</p>
    <p style="margin: 5px 0;"><strong>Name:</strong> [NAME]</p>
    <p style="margin: 5px 0;"><strong>Purpose:</strong> [PURPOSE]</p>
    [Any other relevant beneficiary details as paragraphs]
  </div>
  
  <h4 style="font-size: 14px; font-weight: bold; margin: 20px 0 10px 0;">Payment Details</h4>
  
  <table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #ccc;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">PAYMENT DATE</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">REFERENCE NO.</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">AMOUNT SENT</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">AMOUNT RECEIVED</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">PAID BY</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #ccc; padding: 8px;">[DATE]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[REF]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[AMOUNT]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[AMOUNT]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[COMPANY]</td>
      </tr>
    </tbody>
  </table>
  
  [Include any additional relevant information as paragraphs with proper formatting]
  
  <div style="margin: 30px 0 0 0;">
    <p style="margin: 5px 0;"><strong>Authorized Signature:</strong> ____________________</p>
  </div>
</div>

IMPORTANT: 
- Return ONLY the HTML content with inline styles, NO markdown code blocks, NO backticks
- Do NOT include ```html or ``` in your response
- Do NOT include the company header (SUSTAINABLE YIELD CAPITAL LTD) as it will be added by the app
- Do NOT include any horizontal lines (hr) or separators
- Extract ALL information from the provided content
- Do not invent or assume information that is not present
- Use the exact HTML table structure shown above for the payment details table
- Keep it professional and well-structured`;

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
          { role: 'user', content: `Format this receipt content:\n\n${content}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    let formattedReceipt = data.choices[0].message.content;
    
    // Remove markdown code blocks if present (including variations like ```html!)
    formattedReceipt = formattedReceipt.replace(/^```html!?\n?/i, '').replace(/\n?```$/i, '').trim();

    return new Response(
      JSON.stringify({ formattedReceipt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in format-receipt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
