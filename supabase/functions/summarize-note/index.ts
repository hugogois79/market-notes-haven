
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { content, maxLength = 150 } = await req.json();
    
    if (!content || content.trim() === '') {
      return new Response(
        JSON.stringify({ summary: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean HTML content
    const cleanContent = content.replace(/<[^>]*>/g, ' ').trim();
    
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key is not set in environment variables');
      throw new Error('OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.');
    }
    
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
            content: `You are a financial analyst assistant that generates concise summaries. 
                      Keep summaries under ${maxLength} characters.
                      Focus on extracting key financial insights, trade recommendations, asset values, and important conclusions.
                      Highlight specific numbers, percentages, trends, and actionable trading information when present.
                      Use professional financial terminology.
                      Format important values or trades in bold if possible.
                      Start with the most critical financial information.
                      Do not use introductory phrases like "This note discusses" or "This is about".
                      If the content is too short, unclear, or contains no financial information, respond with a general summary.`
          },
          { role: 'user', content: `Summarize this financial note: ${cleanContent}` }
        ],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Failed to generate summary');
    }
    
    const summary = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
