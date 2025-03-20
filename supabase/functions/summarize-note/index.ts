
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
  
  const { content, maxLength = 500, summarizeTradeChat = false, formatAsBulletPoints = false } = await req.json();
  
  if (!content) {
    return new Response(
      JSON.stringify({ error: 'Content is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  
  try {
    // Define the system prompt based on what we're summarizing
    let systemPrompt = summarizeTradeChat
      ? `You are an AI assistant specializing in trading journal analysis. Summarize the following trading journal entries, focusing on key insights, strategies, and patterns.`
      : `You are an AI assistant that summarizes content. Create a concise summary of the provided text.`;
    
    // Add bullet point formatting instruction if requested
    if (formatAsBulletPoints) {
      systemPrompt += ` Format your summary as 3-5 bullet points, each starting with '- ' and focusing on the most important aspects.`;
    }
    
    systemPrompt += ` The summary should be no longer than ${maxLength} characters.`;
    
    // Call OpenAI API to generate the summary
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content }
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });
    
    const data = await openAIResponse.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error calling OpenAI API');
    }
    
    const summary = data.choices[0].message.content;
    
    console.log("Generated summary:", summary);
    
    // Check if the note content includes a conclusion paragraph
    const hasConclusion = content.toLowerCase().includes('conclusion') || 
                         content.toLowerCase().includes('in summary') ||
                         content.toLowerCase().includes('to summarize');
    
    // Return the summary and conclusion flag
    return new Response(
      JSON.stringify({ summary, hasConclusion }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
