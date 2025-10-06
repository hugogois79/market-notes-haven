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

    const systemPrompt = `You are a professional receipt formatter. Analyze the provided receipt content and extract all relevant information to create a clean, professional payment receipt.

INSTRUCTIONS:
1. Carefully read and extract ALL information from the content
2. Identify the company/issuer information (name, address, company number, etc.)
3. Extract beneficiary details (name, position, purpose, etc.)
4. Extract payment details (date, amount, reference, bank details, etc.)
5. Format it professionally with clear sections

OUTPUT FORMAT:

[COMPANY NAME]
[Company Address]
[Company Registration Details]

---

PAYMENT RECEIPT - [RECEIPT TYPE]

Beneficiary:
Name: [NAME]
Position: [POSITION if applicable]
Purpose: [PURPOSE]
[Any other relevant beneficiary details]

---

Payment Details

| PAYMENT DATE | REFERENCE NO. | AMOUNT SENT | AMOUNT RECEIVED | PAID BY |
|--------------|---------------|-------------|-----------------|---------|
| [DATE] | [REF] | [AMOUNT] | [AMOUNT] | [COMPANY] |

• Payment Method: [METHOD]
• Beneficiary Bank: [BANK NAME]
• Account Details: [ACCOUNT INFO]
• BIC/SWIFT: [BIC if available]
• Payment Description: [DESCRIPTION]

[Include any additional relevant information]

---

Issued by: [COMPANY NAME]
Date of Issue: [DATE]

Authorized Signature: ____________________

IMPORTANT: Extract ALL information from the provided content. Do not invent or assume information that is not present. Keep the format professional and well-structured.`;

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
    const formattedReceipt = data.choices[0].message.content;

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
