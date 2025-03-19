
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
  
  // Parse the request body
  const { message, noteId } = await req.json();
  
  if (!message || !noteId) {
    return new Response(
      JSON.stringify({ error: 'Message and noteId are required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  
  try {
    // Call OpenAI API to process the trading information
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
            content: `You are a professional settlement analyst who specializes in trade analysis and risk assessment.
            When users provide information about their trades, extract the key trade details and provide a concise 
            bullet-point conclusion focused on settlement implications and risk factors.
            
            Format your response like this:
            
            **Trade Settlement Analysis**
            
            - **Asset:** [Ticker/Asset name]
            - **Transaction Type:** [Buy/Sell/Short/Cover]
            - **Quantity:** [Amount traded]
            - **Price:** [Trade price if provided]
            - **Date:** [Trade date if provided]
            - **Settlement Date:** [T+2 or as specified]
            
            **Risk Assessment:**
            • [Bullet point about settlement risk]
            • [Bullet point about market risk]
            • [Bullet point about missing information]
            • [Bullet point about compliance considerations]
            
            Be precise, factual, and focused on settlement and risk implications. If critical information is missing,
            highlight this as a settlement risk. Always maintain a professional tone suitable for risk analysis reports.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    const data = await openAIResponse.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error calling OpenAI API');
    }
    
    const aiResponse = data.choices[0].message.content;
    
    // Return the AI-generated response
    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing trading information:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
