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

    console.log(`Explaining document: ${fileName}`);

    const systemPrompt = `You are a helpful document analyst. Analyze the provided document and provide a clear, concise explanation in Portuguese.

Your response should include:
1. **Tipo de Documento**: What type of document this is (e.g., carta bancária, fatura, contrato, recibo, etc.)
2. **Resumo**: A brief summary of the document's purpose and main content
3. **Pontos Importantes**: Key information or action items from the document
4. **Entidades Envolvidas**: Companies or persons mentioned in the document
5. **Datas Relevantes**: Any important dates mentioned
6. **Valores**: Any monetary amounts mentioned

Format your response in a clear, readable way using markdown. Be concise but thorough.`;

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
          { role: 'user', content: `Analisa este documento:\n\nNome do ficheiro: ${fileName}\n\nConteúdo:\n${fileContent.substring(0, 15000)}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices[0].message.content;

    console.log('Document explanation generated');

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in explain-document function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
