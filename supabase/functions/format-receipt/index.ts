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
    console.log('Received content length:', content?.length);
    console.log('First 500 chars:', content?.substring(0, 500));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a professional receipt formatter. Analyze the provided receipt content and extract ALL relevant information to create a clean, professional payment receipt in HTML format.

ABSOLUTELY CRITICAL - READ FIRST:
1. You MUST include EVERY SINGLE piece of information from the input content
2. Do NOT skip, omit, or summarize ANY information
3. If information is provided, it MUST appear in the output
4. Extract ALL dates, amounts, references, names, addresses, and details
5. Your job is to FORMAT, not to filter or reduce information

CRITICAL LANGUAGE DETECTION:
1. DETECT the language of the input content (Portuguese or English)
2. Generate the ENTIRE receipt in the SAME language as the input
3. If the input is in Portuguese, ALL labels, titles, and text must be in Portuguese
4. If the input is in English, ALL labels, titles, and text must be in English
5. DO NOT mix languages - be consistent throughout the receipt

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. ABSOLUTELY NO company header, name, or logo in your output
2. NEVER write "SUSTAINABLE YIELD CAPITAL LTD" or any variation
3. NEVER write "SUSTAINABLE YIELD VENTURES CAPITAL LTD" or similar
4. NEVER write company addresses (Dept 302, Doncaster, London, etc.)
5. NEVER write "Company Number" or "Company Registration Number"
6. The application will add the company header - you must ONLY format the receipt body
7. Start IMMEDIATELY with the receipt title (e.g., "PAYMENT RECEIPT" or "RECIBO DE PAGAMENTO")

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

EXAMPLE FOR ENGLISH:
<div style="font-family: 'Lato', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- START HERE - Do NOT include ANY company information above this line -->
  
  <div style="margin: 15px 0; text-align: right;">
    <p style="font-weight: bold; margin: 10px 0;">Beneficiary:</p>
    <p style="margin: 5px 0;"><strong>Full Name:</strong> [COMPLETE LEGAL NAME]</p>
    <p style="margin: 5px 0;"><strong>Position/Title:</strong> [JOB TITLE OR ROLE]</p>
    <p style="margin: 5px 0;"><strong>Company/Organization:</strong> [EMPLOYER OR AFFILIATION]</p>
    <p style="margin: 5px 0;"><strong>Department:</strong> [DEPARTMENT IF APPLICABLE]</p>
    <p style="margin: 5px 0;"><strong>ID/Passport Number:</strong> [IDENTIFICATION NUMBER]</p>
    <p style="margin: 5px 0;"><strong>Tax/VAT Number:</strong> [TAX ID IF PROVIDED]</p>
    <p style="margin: 5px 0;"><strong>Address:</strong> [COMPLETE ADDRESS WITH ALL DETAILS - STREET, BUILDING, FLOOR, CITY, POSTAL CODE, COUNTRY]</p>
    <p style="margin: 5px 0;"><strong>Phone:</strong> [PRIMARY PHONE NUMBER]</p>
    <p style="margin: 5px 0;"><strong>Alternative Phone:</strong> [SECONDARY PHONE IF PROVIDED]</p>
    <p style="margin: 5px 0;"><strong>Email:</strong> [EMAIL ADDRESS]</p>
    <p style="margin: 5px 0;"><strong>Nationality:</strong> [NATIONALITY IF MENTIONED]</p>
    <p style="margin: 5px 0;"><strong>Relationship:</strong> [RELATIONSHIP TO COMPANY - EMPLOYEE, CONTRACTOR, ETC.]</p>
    [Include EVERY additional detail about the beneficiary that was provided in the content - omit nothing]
  </div>
  
  <h3 style="font-size: 16px; font-weight: bold; margin: 20px 0 15px 0; text-align: center; text-decoration: underline;">PAYMENT RECEIPT - [RECEIPT TYPE]</h3>

EXAMPLE FOR PORTUGUESE:
<div style="font-family: 'Lato', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <!-- START HERE - Do NOT include ANY company information above this line -->
  
  <div style="margin: 15px 0; text-align: right;">
    <p style="font-weight: bold; margin: 10px 0;">Beneficiário:</p>
    <p style="margin: 5px 0;"><strong>Nome Completo:</strong> [NOME LEGAL COMPLETO]</p>
    <p style="margin: 5px 0;"><strong>Cargo/Título:</strong> [CARGO OU FUNÇÃO]</p>
    <p style="margin: 5px 0;"><strong>Empresa/Organização:</strong> [EMPREGADOR OU AFILIAÇÃO]</p>
    <p style="margin: 5px 0;"><strong>Departamento:</strong> [DEPARTAMENTO SE APLICÁVEL]</p>
    <p style="margin: 5px 0;"><strong>BI/Passaporte:</strong> [NÚMERO DE IDENTIFICAÇÃO]</p>
    <p style="margin: 5px 0;"><strong>NIF/Número Fiscal:</strong> [NIF SE FORNECIDO]</p>
    <p style="margin: 5px 0;"><strong>Morada:</strong> [MORADA COMPLETA COM TODOS OS DETALHES - RUA, EDIFÍCIO, ANDAR, CIDADE, CÓDIGO POSTAL, PAÍS]</p>
    <p style="margin: 5px 0;"><strong>Telefone:</strong> [NÚMERO DE TELEFONE PRINCIPAL]</p>
    <p style="margin: 5px 0;"><strong>Telefone Alternativo:</strong> [TELEFONE SECUNDÁRIO SE FORNECIDO]</p>
    <p style="margin: 5px 0;"><strong>Email:</strong> [ENDEREÇO DE EMAIL]</p>
    <p style="margin: 5px 0;"><strong>Nacionalidade:</strong> [NACIONALIDADE SE MENCIONADA]</p>
    <p style="margin: 5px 0;"><strong>Relacionamento:</strong> [RELAÇÃO COM A EMPRESA - EMPREGADO, CONTRATADO, ETC.]</p>
    [Incluir TODOS os detalhes adicionais sobre o beneficiário que foram fornecidos no conteúdo - não omitir nada]
  </div>
  
  <h3 style="font-size: 16px; font-weight: bold; margin: 20px 0 15px 0; text-align: center; text-decoration: underline;">RECIBO DE PAGAMENTO - [TIPO DE RECIBO]</h3>
  
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
- ABSOLUTELY NO company name, header, or contact information
- ABSOLUTELY NO "SUSTAINABLE YIELD" text of any variation
- DO NOT include any horizontal lines (hr) or separators at the top
- Your output must start with: <div style="font-family: Arial
- CRITICAL: Extract ALL information from the provided content accurately - INCLUDE EVERYTHING
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
