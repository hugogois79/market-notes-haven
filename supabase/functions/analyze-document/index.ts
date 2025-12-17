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

    const systemPrompt = `You are a financial document analyzer specialized in extracting payment and transaction data. Analyze the provided document content and determine if it is:
1. A LOAN document (empréstimo) - contracts, loan agreements, credit agreements
2. A TRANSACTION document (transação/movimento) - invoices, receipts, payment confirmations, bank statements, transfer receipts
3. UNKNOWN - if you cannot determine the type

CRITICAL INSTRUCTIONS FOR ENTITY EXTRACTION:
- For TRANSACTIONS, "entityName" is the BENEFICIARY/RECIPIENT of the payment (who received the money), NOT the payer or the bank.
- Look for fields like: "Beneficiário", "Destinatário", "A favor de", "Para", "Nome do beneficiário", "Recipient", "Payee", "To:", "Transferência para".
- IGNORE the payer's name (who made the payment), bank names, or intermediary entities.
- If this is a receipt/comprovativo, the entityName is the person/company who RECEIVED the payment.
- For bank transfers, look specifically for the beneficiary account holder name.
- Extract the FULL name of the beneficiary as it appears in the document.

Respond in JSON format with the following structure:
{
  "documentType": "loan" | "transaction" | "unknown",
  "confidence": number between 0 and 1,
  "summary": "brief description of the document in Portuguese",
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
    "entityName": "string" or null (THE BENEFICIARY/RECIPIENT - who received the money),
    "description": "string" or null,
    "transactionType": "income" | "expense" | null,
    "invoiceNumber": "string" or null
  },
  "reasoning": "explanation of why you classified it this way and how you identified the beneficiary"
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
