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

CRITICAL INSTRUCTIONS:
1. DO NOT include ANY company header or name in your output
2. DO NOT include "SUSTAINABLE YIELD CAPITAL LTD" or any variation of it
3. DO NOT include "SUSTAINABLE YIELD VENTURES CAPITAL LTD" or similar
4. The app will add the company header automatically - you must NOT include it
5. Start directly with the receipt title

FORMAT INSTRUCTIONS:
1. Carefully read and extract ALL information from the content
2. Extract beneficiary details (name, position, purpose, etc.)
3. Extract payment details (date, amount, reference, bank details, etc.)
4. Format it professionally with clear sections using HTML with inline styles

OUTPUT FORMAT (HTML with inline styles):

<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- CRITICAL: Do NOT include ANY company header, name, or logo -->
  <!-- Start directly with the receipt title -->
  
  <!-- Title (left-aligned) -->
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

CRITICAL RULES: 
- Return ONLY the HTML content with inline styles
- ABSOLUTELY NO markdown code blocks, NO backticks, NO ```html or ```
- DO NOT include ANY company name or header (no "SUSTAINABLE YIELD" of any kind)
- DO NOT include any horizontal lines (hr) or separators
- Start directly with the receipt title
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
    
    // Remove markdown code blocks aggressively (any variation)
    formattedReceipt = formattedReceipt
      .replace(/```html!?/gi, '')
      .replace(/```/g, '')
      .trim();
    
    // Remove any company headers/names that might have been generated (multiple passes)
    formattedReceipt = formattedReceipt
      .replace(/<h[1-6][^>]*>SUSTAINABLE YIELD[^<]*<\/h[1-6]>/gi, '')
      .replace(/<p[^>]*>SUSTAINABLE YIELD[^<]*<\/p>/gi, '')
      .replace(/<div[^>]*>SUSTAINABLE YIELD[^<]*<\/div>/gi, '')
      .replace(/SUSTAINABLE YIELD[^\n<]*/gi, '')
      .replace(/<h[1-6][^>]*>Dept \d+[^<]*<\/h[1-6]>/gi, '')
      .replace(/<p[^>]*>Dept \d+[^<]*<\/p>/gi, '')
      .replace(/<p[^>]*>Doncaster[^<]*<\/p>/gi, '')
      .replace(/<p[^>]*>London[^<]*<\/p>/gi, '')
      .replace(/<p[^>]*>Company (?:Number|Registration Number)[^<]*<\/p>/gi, '')
      .replace(/Dept \d+[^\n<]*/gi, '')
      .replace(/Company (?:Number|Registration Number)[^\n<]*/gi, '')
      .trim();

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
