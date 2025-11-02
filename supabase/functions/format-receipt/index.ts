import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  content: z.string().min(1, "Content cannot be empty").max(100000, "Content too long")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const requestData = await req.json();
    const validationResult = requestSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const { content } = validationResult.data;
    console.log('Received content length:', content?.length);
    console.log('First 500 chars:', content?.substring(0, 500));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Enhanced language detection - analyze the payment content specifically
    // Look for key payment-related terms to determine language
    const contentLower = content.toLowerCase();
    
    // Count English payment terms
    const englishTerms = [
      'payment', 'receipt', 'beneficiary', 'address', 'bank account', 
      'reference', 'signature', 'authorized', 'amount', 'confirmed',
      'managing director', 'kind regards', 'please acknowledge'
    ];
    
    // Count Portuguese payment terms
    const portugueseTerms = [
      'pagamento', 'recibo', 'beneficiário', 'morada', 'conta bancária',
      'referência', 'assinatura', 'autorizada', 'montante', 'confirmado',
      'diretor', 'cumprimentos', 'por favor confirme'
    ];
    
    const englishCount = englishTerms.filter(term => contentLower.includes(term)).length;
    const portugueseCount = portugueseTerms.filter(term => contentLower.includes(term)).length;
    
    // Default to English if counts are equal or both zero
    const isEnglish = englishCount >= portugueseCount;
    const language = isEnglish ? 'English' : 'Portuguese';
    
    console.log(`Language detection - English terms: ${englishCount}, Portuguese terms: ${portugueseCount}, Selected: ${language}`);

    const systemPrompt = `You are a professional receipt formatter. Analyze the provided receipt content and extract ALL relevant information to create a clean, professional payment receipt in HTML format.

ABSOLUTELY CRITICAL - LANGUAGE REQUIREMENT:
1. The input content is primarily in ${language}
2. You MUST generate the ENTIRE receipt in ${language} ONLY
3. ALL labels, titles, headers, field names, and text MUST be in ${language}
4. DO NOT mix languages - be 100% consistent in ${language} throughout
5. If ${language} is Portuguese: use "Beneficiário", "Data de Pagamento", "Montante", "Assinatura Autorizada", "Data da Emissão", "Assunto", etc.
6. If ${language} is English: use "Beneficiary", "Payment Date", "Amount", "Authorized Signature", "Date of Issue", "Subject", etc.
7. VERIFY: Before returning, check that ALL field labels are in ${language}

CRITICAL - COMPANY HEADER INSTRUCTIONS:
1. DO NOT include company header - the system handles this separately
2. DO NOT include company name, registration number, address, email, or bank details at the top
3. DO NOT add placeholder text like "[Adicionar se disponível]" or "[email@example.com]"
4. Start directly with a horizontal line separator
5. Then proceed with the beneficiary section

ABSOLUTELY CRITICAL - CONTENT EXTRACTION:
1. You MUST include EVERY SINGLE piece of information from the input content
2. Do NOT skip, omit, or summarize ANY information
3. If information is provided, it MUST appear in the output
4. Extract ALL dates, amounts, references, names, addresses, and details
5. Your job is to FORMAT, not to filter or reduce information

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. DO NOT include company header at the top - this is handled by the system
2. DO NOT add placeholder fields for missing information
3. Start with a horizontal separator line
4. Then proceed with the beneficiary and payment sections

FORMAT INSTRUCTIONS:
1. Carefully read and extract ALL information from the content - DO NOT SKIP ANYTHING
2. VERIFY you have included EVERY date, amount, reference number, and detail from the input
3. BENEFICIARY DETAILS - MAXIMUM EXTRACTION (CRITICAL):
   Extract EVERY detail about the beneficiary to create a complete profile:
   - Full legal name (first name, middle names, surname, any suffixes)
   - Position/Title/Role (e.g., Director, Manager, Consultant, Employee, Contractor)
   - Professional designation or credentials (if mentioned)
   - Company affiliation or employer (if working for an organization)
   - Department or business unit (if applicable)
   - ID/Passport/Tax identification number (BI, Passaporte, NIF, VAT number, etc.)
   - Complete residential or business address (street number and name, building/apartment, floor, city, region, postal code, country)
   - Primary contact information (mobile phone, landline, email address)
   - Secondary contact information (alternative phone, fax, secondary email)
   - Bank account details (if provided and relevant)
   - Relationship to the company/project (employee, contractor, consultant, partner, vendor)
   - Nationality or citizenship (if mentioned)
   - Date of birth or age (if provided)
   - Any other identifying, professional, or personal details mentioned in the content
   
   IMPORTANT: Do NOT omit ANY beneficiary information that is available in the content. Include everything provided, even if it seems like a minor detail. The beneficiary section should be as comprehensive and detailed as possible.

3. Extract payment details (date, amount, reference, bank details, etc.)
4. Format it professionally with clear sections using HTML with inline styles
5. ALIGNMENT RULES (CRITICAL):
   - Beneficiary NAME AND POSITION ONLY: aligned to the RIGHT (text-align: right)
   - Purpose, Event Preparation: aligned to the LEFT (text-align: left)
   - Payment details section (payment method, bank details, IBAN, etc.): aligned to the LEFT
   - Authorized Signature: aligned to the RIGHT
   - All other content should be left-aligned by default

OUTPUT FORMAT (HTML with inline styles):

${language === 'English' ? `
EXAMPLE FOR ENGLISH:
<div style="font-family: 'Lato', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- COMPANY HEADER - DO NOT INCLUDE, HEADER IS HANDLED BY THE SYSTEM -->
  <hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;" />
  
  <div style="margin: 15px 0; text-align: right;">
    <p style="font-weight: bold; margin: 10px 0;">Beneficiary:</p>
    <p style="margin: 5px 0;"><strong>Full Name:</strong> [COMPLETE LEGAL NAME]</p>
    <p style="margin: 5px 0;"><strong>Position/Title:</strong> [JOB TITLE OR ROLE]</p>
    <p style="margin: 5px 0;"><strong>Company/Organization:</strong> [EMPLOYER OR AFFILIATION]</p>
    <p style="margin: 5px 0;"><strong>Address:</strong> [COMPLETE ADDRESS]</p>
    <p style="margin: 5px 0;"><strong>IBAN:</strong> [IBAN NUMBER]</p>
  </div>
  
  <h3 style="font-size: 16px; font-weight: bold; margin: 20px 0 15px 0; text-align: center; text-decoration: underline;">PAYMENT RECEIPT - Legal Fees</h3>
  
  <div style="margin: 15px 0; text-align: left;">
    <p style="margin: 5px 0;"><strong>Date of Issue:</strong> Porto, October 15, 2025</p>
    <p style="margin: 5px 0;"><strong>Subject:</strong> Confirmation of Full Payment - Legal Fees (€40,000)</p>
  </div>
` : `
EXAMPLE FOR PORTUGUESE:
<div style="font-family: 'Lato', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- CABEÇALHO DA EMPRESA - NÃO INCLUIR, O CABEÇALHO É TRATADO PELO SISTEMA -->
  <hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;" />
  
  <div style="margin: 15px 0; text-align: right;">
    <p style="font-weight: bold; margin: 10px 0;">Beneficiário:</p>
    <p style="margin: 5px 0;"><strong>Nome Completo:</strong> [NOME LEGAL COMPLETO]</p>
    <p style="margin: 5px 0;"><strong>Cargo/Título:</strong> [CARGO OU FUNÇÃO]</p>
    <p style="margin: 5px 0;"><strong>Empresa/Organização:</strong> [EMPREGADOR]</p>
    <p style="margin: 5px 0;"><strong>Morada:</strong> [MORADA COMPLETA]</p>
    <p style="margin: 5px 0;"><strong>IBAN:</strong> [NÚMERO IBAN]</p>
  </div>
  
  <h3 style="font-size: 16px; font-weight: bold; margin: 20px 0 15px 0; text-align: center; text-decoration: underline;">RECIBO DE PAGAMENTO - Honorários Legais</h3>
  
  <div style="margin: 15px 0; text-align: left;">
    <p style="margin: 5px 0;"><strong>Data da Emissão:</strong> Porto, 15 de outubro de 2025</p>
    <p style="margin: 5px 0;"><strong>Assunto:</strong> Confirmação de Pagamento Integral - Honorários Legais (€40.000)</p>
  </div>
`}
  
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

IN PORTUGUESE, USE THIS TABLE STRUCTURE:
  <div style="margin: 15px 0; text-align: left;">
    <p style="margin: 5px 0;"><strong>Finalidade:</strong> [DESCRIÇÃO DA FINALIDADE]</p>
    <p style="margin: 5px 0;"><strong>Preparação do Evento:</strong> [DETALHES DO EVENTO]</p>
  </div>
  
  <h4 style="font-size: 14px; font-weight: bold; margin: 20px 0 10px 0;">Detalhes do Pagamento</h4>
  
  <table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #ccc;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">DATA DE PAGAMENTO</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">REFERÊNCIA Nº</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">MONTANTE ENVIADO</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">MONTANTE RECEBIDO</th>
        <th style="border: 1px solid #ccc; padding: 8px; text-align: left; font-weight: bold;">PAGO POR</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #ccc; padding: 8px;">[DATA]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[REF]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[MONTANTE]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[MONTANTE]</td>
        <td style="border: 1px solid #ccc; padding: 8px;">[EMPRESA]</td>
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

IN PORTUGUESE, USE THIS STRUCTURE:
  <div style="margin: 20px 0; text-align: left;">
    <p style="margin: 5px 0;"><strong>Método de Pagamento:</strong> [MÉTODO DE PAGAMENTO]</p>
    <p style="margin: 5px 0;"><strong>Banco do Beneficiário:</strong> [NOME DO BANCO]</p>
    <p style="margin: 5px 0;"><strong>IBAN:</strong> [NÚMERO IBAN]</p>
    <p style="margin: 5px 0;"><strong>BIC/SWIFT:</strong> [CÓDIGO SWIFT]</p>
    <p style="margin: 5px 0;"><strong>Descrição do Pagamento:</strong> [DESCRIÇÃO]</p>
    <p style="margin: 5px 0;"><strong>Data de Emissão:</strong> [DATA]</p>
  </div>
  
  [Include any additional relevant information as paragraphs with proper formatting and left alignment]
  
  <div style="margin: 30px 0 0 0; text-align: right;">
    <p style="margin: 5px 0;"><strong>Authorized Signature:</strong> ____________________</p>
  </div>

IN PORTUGUESE:
  <div style="margin: 30px 0 0 0; text-align: right;">
    <p style="margin: 5px 0;"><strong>Assinatura Autorizada:</strong> ____________________</p>
  </div>

</div>

CRITICAL RULES - MUST FOLLOW: 
- Return ONLY the HTML content with inline styles - nothing else
- ABSOLUTELY NO markdown formatting (NO code blocks, NO backticks of any kind)
- DO NOT include company header - the system handles this
- DO NOT add placeholder text for missing fields
- Start with a horizontal line separator
- Then proceed with the beneficiary and payment sections
- CRITICAL: Generate ALL labels and text in ${language} ONLY - no mixing of languages
- CRITICAL: Extract ALL information from the provided content accurately - INCLUDE EVERYTHING
- Use professional formatting with proper spacing and alignment
- Keep the beneficiary section aligned to the RIGHT
- Keep payment details and other sections aligned to the LEFT
- VERIFY LANGUAGE: Before returning, confirm that EVERY label is in ${language}
- CRITICAL: Every date, amount, reference, bank detail, and description from the input MUST be in your output
- BENEFICIARY INFORMATION: Extract and include EVERY SINGLE detail provided about the beneficiary - omit NOTHING. Be exhaustive and comprehensive in the beneficiary section.
- PAYMENT INFORMATION: Include ALL payment details - dates, amounts (sent AND received), fees, reference numbers, transfer IDs
- BANK DETAILS: Include ALL bank information - IBAN, BIC/SWIFT, bank names, account details
- Do not invent or assume information that is not present
- Do not skip, omit, or summarize any information that IS present
- Use the exact HTML table structure shown above
- CRITICAL: AFTER THE TABLE, include Payment Method, Beneficiary Bank, IBAN, BIC/SWIFT, Payment Description, and Date of Issue aligned to the LEFT (text-align: left)
- Keep it professional and well-structured
- USE THE SAME LANGUAGE AS THE INPUT CONTENT throughout the entire receipt
- VERIFY BEFORE RETURNING: Does your output contain ALL the information from the input? If not, you failed.`;

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
    
    console.log('AI Response length:', formattedReceipt?.length);
    console.log('AI Response preview:', formattedReceipt?.substring(0, 1000));
    
    // Remove markdown code blocks
    formattedReceipt = formattedReceipt
      .replace(/```html!?/gi, '')
      .replace(/```/g, '')
      .replace(/`/g, '')
      .trim();
    
    // Remove conversational text and questions - extract only HTML content
    // Look for the first <div and last </div> to extract only the receipt HTML
    const firstDivIndex = formattedReceipt.indexOf('<div');
    const lastDivIndex = formattedReceipt.lastIndexOf('</div>');
    
    if (firstDivIndex !== -1 && lastDivIndex !== -1 && lastDivIndex > firstDivIndex) {
      formattedReceipt = formattedReceipt.substring(firstDivIndex, lastDivIndex + 6); // +6 for '</div>'
      console.log('Extracted HTML content between <div> tags');
    }
    
    // Additional cleanup: remove any remaining conversational phrases
    const conversationalPatterns = [
      /Perfeito\s*[✅✓]?\s*/gi,
      /Quer que eu gere[^?]*\?/gi,
      /Com base nos[^.]*\./gi,
      /Would you like me to[^?]*\?/gi,
      /Here's the formatted receipt[^.]*\./gi,
      /I've formatted the receipt[^.]*\./gi,
      /Based on the information provided[^.]*\./gi
    ];
    
    conversationalPatterns.forEach(pattern => {
      formattedReceipt = formattedReceipt.replace(pattern, '');
    });
    
    // Remove placeholder lines for missing company information
    const placeholderPatterns = [
      /<p[^>]*>.*?\[email@example\.com[^\]]*\].*?<\/p>/gi,
      /<p[^>]*>.*?\[Adicionar[^\]]*\].*?<\/p>/gi,
      /<p[^>]*>.*?\[Número da Conta[^\]]*\].*?<\/p>/gi,
      /<p[^>]*>.*?\[Nome do Banco[^\]]*\].*?<\/p>/gi,
      /<p[^>]*>.*?\[Add [^\]]*if available\].*?<\/p>/gi,
      /<p[^>]*>.*?Email:.*?\[.*?Adicionar.*?\].*?<\/p>/gi,
      /<p[^>]*>.*?Conta Bancária:.*?\[.*?Adicionar.*?\].*?<\/p>/gi,
      /<p[^>]*>.*?Banco:.*?\[.*?Adicionar.*?\].*?<\/p>/gi,
      /<p[^>]*>.*?Capital Social:.*?\[.*?Adicionar.*?\].*?<\/p>/gi
    ];
    
    placeholderPatterns.forEach(pattern => {
      formattedReceipt = formattedReceipt.replace(pattern, '');
    });
    
    formattedReceipt = formattedReceipt.trim();

    // Extract structured data from the formatted receipt
    const extractField = (html: string, patterns: string[]): string | null => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        const match = html.match(regex);
        if (match && match[1]) {
          return match[1].replace(/<[^>]*>/g, '').trim();
        }
      }
      return null;
    };

    // Extract beneficiary name
    const beneficiaryName = extractField(formattedReceipt, [
      /<strong>(?:Full Name|Nome Completo):<\/strong>\s*([^<]+)/,
      /<strong>Beneficiary:<\/strong>\s*([^<]+)/,
      /<strong>Beneficiário:<\/strong>\s*([^<]+)/,
      /Beneficiary:\s*<\/p>\s*<p[^>]*>(?:<strong>[^:]+:<\/strong>\s*)?([^<]+)/,
      /Beneficiário:\s*<\/p>\s*<p[^>]*>(?:<strong>[^:]+:<\/strong>\s*)?([^<]+)/
    ]);

    // Extract payment amount
    const paymentAmount = extractField(formattedReceipt, [
      /<strong>(?:Amount Sent|Amount|Total|Montante Enviado|Montante|Total Pago):<\/strong>\s*([€$£]?\s*[\d,.]+\s*[€$£]?)/,
      /<td[^>]*>([€$£]?\s*[\d,.]+\s*[€$£]?)<\/td>[^<]*<\/tr>/,
      /(?:Amount|Montante|Total):\s*([€$£]?\s*[\d,.]+\s*[€$£]?)/
    ]);

    // Extract payment date
    const paymentDate = extractField(formattedReceipt, [
      /<strong>(?:Payment Date|Transfer Date|Date|Data de Pagamento|Data da Transferência):<\/strong>\s*([^<]+)/,
      /<strong>(?:Date of Issue|Data de Emissão):<\/strong>\s*([^<]+)/,
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/
    ]);

    // Extract payment reference
    const paymentReference = extractField(formattedReceipt, [
      /<strong>(?:Reference|Ref|Payment Reference|Transfer|Referência|Comprovativo).*?:<\/strong>\s*([^<]+)/,
      /(?:Reference|Ref|Referência).*?:\s*([A-Z0-9#]+)/,
      /#\d+/
    ]);

    console.log('Extracted data:', {
      beneficiaryName,
      paymentAmount,
      paymentDate,
      paymentReference
    });

    return new Response(
      JSON.stringify({ 
        formattedReceipt,
        beneficiary_name: beneficiaryName,
        payment_amount: paymentAmount,
        payment_date: paymentDate,
        payment_reference: paymentReference
      }),
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
