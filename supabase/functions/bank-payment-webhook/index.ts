import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BankPaymentRequest {
  beneficiaryName: string;
  beneficiaryIban: string;
  amount: number;
  currency: string;
  sourceAccountId: string;
  reference: string;
  executionDate: string;
  documentId: string;
  documentUrl: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('N8N_BANK_PAYMENT_WEBHOOK');
    if (!webhookUrl) {
      console.error('N8N_BANK_PAYMENT_WEBHOOK secret not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook não configurado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: BankPaymentRequest = await req.json();
    console.log('Received bank payment request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.beneficiaryName || !body.beneficiaryIban || !body.amount || !body.sourceAccountId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios em falta' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client to fetch bank account details
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch source account details
    const { data: sourceAccount, error: accountError } = await supabase
      .from('bank_accounts')
      .select('id, account_name, account_number, company:companies(id, name)')
      .eq('id', body.sourceAccountId)
      .single();

    if (accountError || !sourceAccount) {
      console.error('Error fetching source account:', accountError);
      return new Response(
        JSON.stringify({ success: false, error: 'Conta de origem não encontrada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare payload for n8n
    const n8nPayload = {
      beneficiaryName: body.beneficiaryName,
      beneficiaryIban: body.beneficiaryIban,
      amount: body.amount,
      currency: body.currency || 'EUR',
      reference: body.reference,
      documentId: body.documentId,
      sourceAccount: {
        id: sourceAccount.id,
        name: sourceAccount.account_name,
        iban: sourceAccount.account_number,
      },
    };

    console.log('Sending to n8n webhook:', JSON.stringify(n8nPayload, null, 2));

    // Call n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook error:', n8nResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro no webhook n8n: ${n8nResponse.status}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const n8nResult = await n8nResponse.json();
    console.log('n8n response:', JSON.stringify(n8nResult, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        transferId: n8nResult.transferId || n8nResult.id,
        status: n8nResult.status || 'pending',
        message: n8nResult.message || 'Pagamento enviado com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bank-payment-webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
