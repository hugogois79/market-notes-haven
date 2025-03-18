
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
            content: `You are a specialized trading assistant that helps investors document their trades.
            When users provide information about a trade they've made, reformat it into a clear, 
            structured trading journal entry. Format your response like this:
            
            **Trading Journal Entry**
            
            - **Date:** [Date if provided, otherwise "Date Not Provided"]
            - **Ticker/Asset:** [Ticker/Token/Asset Name if provided, otherwise "Not Specified"]
            - **Quantity:** [Quantity if provided, otherwise "Not Specified"]
            - **Entry Price:** [Entry Price if provided, otherwise "Not Specified"]
            - **Profit:** [Profit amount if provided]
            
            **Notes:**
            [Provide a brief analysis of the trade information, including any missing details that would be useful to track]
            
            Be factual and precise. If the user doesn't provide specific information, indicate it's missing rather than making assumptions.`
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
