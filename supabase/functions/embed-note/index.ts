import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { title, content } = await req.json();

    if (!title && !content) {
      throw new Error('Title or content is required');
    }

    // Combine title and content for embedding
    let textToEmbed = [title, content].filter(Boolean).join('\n\n');
    
    // Truncate to ~30,000 chars to stay within OpenAI's 8192 token limit
    // (roughly 4 chars per token, with safety margin)
    const MAX_CHARS = 30000;
    if (textToEmbed.length > MAX_CHARS) {
      console.log(`Truncating text from ${textToEmbed.length} to ${MAX_CHARS} characters`);
      textToEmbed = textToEmbed.substring(0, MAX_CHARS);
    }

    console.log(`Generating embedding for text of length: ${textToEmbed.length}`);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: textToEmbed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    console.log(`Generated embedding with ${embedding.length} dimensions`);

    return new Response(JSON.stringify({ embedding }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in embed-note function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
