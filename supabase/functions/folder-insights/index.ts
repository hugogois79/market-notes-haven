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
    const { folderName, companyName, documents, subfolders } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build context from documents and subfolders
    const docList = documents?.map((d: any) => 
      `- ${d.name} (${d.document_type || 'Other'}, ${d.status || 'Draft'})`
    ).join('\n') || 'No documents';

    const folderList = subfolders?.map((f: any) => `- ${f.name}`).join('\n') || 'No subfolders';

    const prompt = `Descreve o conteúdo desta pasta em 1-2 frases curtas em Português.

Empresa: ${companyName}
Pasta: ${folderName || 'Root'}

Documentos (${documents?.length || 0}):
${docList}

Subpastas (${subfolders?.length || 0}):
${folderList}

Sê direto e específico. Menciona datas, valores ou entidades importantes se visíveis nos nomes dos ficheiros. Máximo 40 palavras.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Descreves brevemente o conteúdo de pastas de documentos empresariais em Português. Sê conciso e direto - máximo 40 palavras. Foca no que a pasta contém.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const insight = data.choices[0]?.message?.content || 'Unable to generate insights.';

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in folder-insights function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
