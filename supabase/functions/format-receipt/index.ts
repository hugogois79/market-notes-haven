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

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. ABSOLUTELY NO company header, name, or logo in your output
2. NEVER write "SUSTAINABLE YIELD CAPITAL LTD" or any variation
3. NEVER write "SUSTAINABLE YIELD VENTURES CAPITAL LTD" or similar
4. NEVER write company addresses (Dept 302, Doncaster, London, etc.)
5. NEVER write "Company Number" or "Company Registration Number"
6. The application will add the company header - you must ONLY format the receipt body
7. Start IMMEDIATELY with the receipt title (e.g., "PAYMENT RECEIPT")

FORMAT INSTRUCTIONS:
1. Carefully read and extract ALL information from the content
2. Extract beneficiary details (name, position, purpose, etc.)
3. Extract payment details (date, amount, reference, bank details, etc.)
4. Format it professionally with clear sections using HTML with inline styles
5. ALIGNMENT RULES (CRITICAL):
   - Beneficiary NAME AND POSITION ONLY: aligned to the RIGHT (text-align: right)
   - Purpose, Event Preparation: aligned to the LEFT (text-align: left)
   - Payment details section (payment method, bank details, IBAN, etc.): aligned to the LEFT
   - Authorized Signature: aligned to the RIGHT
   - All other content should be left-aligned by default

OUTPUT FORMAT (HTML with inline styles):

<div style="font-family: 'Lato', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- START HERE - Do NOT include ANY company information above this line -->
  
  <div style="margin: 15px 0; text-align: right;">
    <p style="font-weight: bold; margin: 10px 0;">Beneficiary:</p>
    <p style="margin: 5px 0;"><strong>Name:</strong> [NAME]</p>
    [Any other beneficiary identification details like position, if applicable]
  </div>
  
  <h3 style="font-size: 16px; font-weight: bold; margin: 20px 0 15px 0; text-align: center; text-decoration: underline;">PAYMENT RECEIPT - [RECEIPT TYPE]</h3>
  
  <div style="margin: 15px 0; text-align: left;">
    <p style="margin: 5px 0;"><strong>Purpose:</strong> [PURPOSE DESCRIPTION]</p>
    <p style="margin: 5px 0;"><strong>Event Preparation:</strong> [EVENT DETAILS]</p>
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
  
  <div style="margin: 20px 0; text-align: left;">
    <p style="margin: 5px 0;"><strong>Payment Method:</strong> [PAYMENT METHOD]</p>
    <p style="margin: 5px 0;"><strong>Beneficiary Bank:</strong> [BANK NAME]</p>
    <p style="margin: 5px 0;"><strong>IBAN:</strong> [IBAN NUMBER]</p>
    <p style="margin: 5px 0;"><strong>BIC/SWIFT:</strong> [SWIFT CODE]</p>
    <p style="margin: 5px 0;"><strong>Payment Description:</strong> [DESCRIPTION]</p>
    <p style="margin: 5px 0;"><strong>Date of Issue:</strong> [DATE]</p>
  </div>
  
  [Include any additional relevant information as paragraphs with proper formatting and left alignment]
  
  <div style="margin: 30px 0 0 0; text-align: right;">
    <p style="margin: 5px 0;"><strong>Authorized Signature:</strong> ____________________</p>
  </div>
</div>

CRITICAL RULES - MUST FOLLOW: 
- Return ONLY the HTML content with inline styles - nothing else
- ABSOLUTELY NO markdown formatting (NO code blocks, NO backticks of any kind)
- ABSOLUTELY NO company name, header, or contact information
- ABSOLUTELY NO "SUSTAINABLE YIELD" text of any variation
- DO NOT include any horizontal lines (hr) or separators at the top
- Your output must start with: <div style="font-family: Arial
- Extract ALL information from the provided content accurately
- Do not invent or assume information that is not present
- Use the exact HTML table structure shown above
- CRITICAL: AFTER THE TABLE, include Payment Method, Beneficiary Bank, IBAN, BIC/SWIFT, Payment Description, and Date of Issue aligned to the LEFT (text-align: left)
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
      .replace(/`/g, '')
      .trim();
    
    // Remove any company headers/names that might have been generated (multiple aggressive passes)
    // First pass - remove header blocks
    formattedReceipt = formattedReceipt
      .replace(/<div[^>]*text-align:\s*center[^>]*>[\s\S]*?SUSTAINABLE YIELD[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>[\s\S]*?SUSTAINABLE[\s\S]*?<\/div>/gi, '');
    
    // Second pass - remove individual elements
    formattedReceipt = formattedReceipt
      .replace(/<h[1-6][^>]*>[\s\S]*?SUSTAINABLE YIELD[\s\S]*?<\/h[1-6]>/gi, '')
      .replace(/<p[^>]*>[\s\S]*?SUSTAINABLE YIELD[\s\S]*?<\/p>/gi, '')
      .replace(/<p[^>]*>[\s\S]*?Dept\s+\d+[\s\S]*?<\/p>/gi, '')
      .replace(/<p[^>]*>[\s\S]*?Doncaster[\s\S]*?<\/p>/gi, '')
      .replace(/<p[^>]*>[\s\S]*?DN6\s+8DA[\s\S]*?<\/p>/gi, '')
      .replace(/<p[^>]*>[\s\S]*?Company Number[\s\S]*?<\/p>/gi, '')
      .replace(/<hr[^>]*>/gi, '');
    
    // Third pass - remove any remaining text mentions
    formattedReceipt = formattedReceipt
      .replace(/SUSTAINABLE YIELD CAPITAL LTD/gi, '')
      .replace(/SUSTAINABLE YIELD/gi, '')
      .replace(/Dept \d+, \d+ Owston Road Carcroft/gi, '')
      .replace(/Doncaster, DN6 8DA[^<\n]*/gi, '')
      .replace(/Company Number:\s*\d+/gi, '')
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
