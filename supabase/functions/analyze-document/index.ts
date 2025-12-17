import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { fileContent, fileName } = await req.json();

    if (!fileContent) {
      throw new Error('No file content provided');
    }

    console.log(`Analyzing document: ${fileName}`);

    const systemPrompt = `You are a financial document analyzer specialized in extracting payment and transaction data from invoices, receipts, and financial documents. 

DOCUMENT CLASSIFICATION:
1. LOAN document (empréstimo) - contracts, loan agreements, credit agreements
2. TRANSACTION document (transação/movimento) - invoices, receipts, payment confirmations, bank statements, transfer receipts, service receipts (Uber, Bolt, etc.)
3. UNKNOWN - if you cannot determine the type

CRITICAL INSTRUCTIONS FOR AMOUNT EXTRACTION:
- Look for "Total", "Valor Total", "Total a pagar", "Montante", "Amount", "Valor"
- European format uses COMMA as decimal separator: "23,98 €" means 23.98
- Convert to number WITHOUT the € symbol: "23,98 €" → 23.98
- Look for the FINAL TOTAL amount, not subtotals or individual items
- If multiple amounts exist, use the one labeled "Total" or the largest final amount

CRITICAL INSTRUCTIONS FOR DATE EXTRACTION:
- Look for transaction/invoice/receipt date, NOT email send dates
- Common formats: "13/12/2025", "13-12-2025", "13 December 2025", "2025-12-13"
- European format is DD/MM/YYYY (day first, then month)
- Convert to YYYY-MM-DD format: "13/12/2025" → "2025-12-13"
- Look for: "Data", "Date", "Data da viagem", "Data do recibo", timestamps near totals

CRITICAL INSTRUCTIONS FOR ENTITY EXTRACTION:
- For service receipts (Uber, Bolt, taxi, etc.): entityName is the SERVICE PROVIDER (e.g., "Uber", "Bolt")
- For invoices: entityName is the company issuing the invoice
- For bank transfers: entityName is the BENEFICIARY who received the money
- IGNORE the payer's name, bank names, or email addresses

Respond in JSON format:
{
  "documentType": "loan" | "transaction" | "unknown",
  "confidence": number between 0 and 1,
  "summary": "brief description in Portuguese",
  "extractedData": {
    "amount": number or null (MUST extract if visible - convert "23,98 €" to 23.98),
    "date": "YYYY-MM-DD" or null (MUST extract if visible - convert DD/MM/YYYY to YYYY-MM-DD),
    "entityName": "string" or null,
    "description": "string" or null (brief description of what was paid for),
    "transactionType": "income" | "expense" | null,
    "invoiceNumber": "string" or null,
    "interestRate": number or null,
    "startDate": "YYYY-MM-DD" or null,
    "endDate": "YYYY-MM-DD" or null,
    "lender": "string" or null,
    "borrower": "string" or null
  },
  "reasoning": "explain how you found the amount and date"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this document:\n\nFilename: ${fileName}\n\nContent:\n${fileContent.substring(0, 15000)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

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
