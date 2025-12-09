import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Get auth header from request to identify user
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    console.log('Step A: Generating embedding for query:', query.substring(0, 100));

    // Step A: Generate embedding for the query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query.substring(0, 8000), // Limit input length
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding API error:', errorText);
      throw new Error(`Failed to generate embedding: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Format embedding as a string for PostgreSQL vector type
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    console.log('Step B: Searching for similar notes...');

    // Step B: Call match_notes RPC to find similar notes
    // Pass embedding as formatted string that PostgreSQL can cast to vector
    const { data: matchedNotes, error: matchError } = await supabase.rpc('match_notes', {
      query_embedding: embeddingString,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (matchError) {
      console.error('Match notes error:', matchError);
      throw new Error(`Failed to search notes: ${matchError.message}`);
    }

    console.log(`Found ${matchedNotes?.length || 0} matching notes`);

    // Step C: Format notes as context
    let contextText = '';
    if (matchedNotes && matchedNotes.length > 0) {
      contextText = matchedNotes.map((note: any, index: number) => {
        const title = note.title || 'Sem título';
        const content = note.content ? 
          note.content.replace(/<[^>]*>/g, '').substring(0, 1500) : 
          'Sem conteúdo';
        const summary = note.summary || '';
        
        return `--- Nota ${index + 1}: "${title}" ---\n${summary ? `Resumo: ${summary}\n` : ''}Conteúdo: ${content}`;
      }).join('\n\n');
    } else {
      contextText = 'Não foram encontradas notas relevantes para esta pergunta.';
    }

    console.log('Step D: Calling OpenAI for response...');

    // Step D: Call OpenAI to generate response
    const systemPrompt = `És um assistente empresarial útil e profissional. A tua função é responder às perguntas do utilizador APENAS com base no contexto das notas fornecidas abaixo.

Regras importantes:
1. Responde sempre em português de Portugal
2. Se a resposta estiver nas notas, cita o título da nota usada entre aspas
3. Se a informação não estiver nas notas, diz claramente: "Não encontrei essa informação nas tuas notas."
4. Sê conciso mas completo nas respostas
5. Se várias notas forem relevantes, menciona todas`;

    const userMessage = `Pergunta do utilizador: ${query}

Contexto das notas:
${contextText}`;

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Chat API error:', errorText);
      throw new Error(`Failed to generate response: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const aiResponse = chatData.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        notesUsed: matchedNotes?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ask-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
