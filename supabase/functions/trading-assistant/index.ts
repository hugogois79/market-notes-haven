
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
            content: `You are a professional settlement analyst who specializes in concise trade documentation.
            Extract only the most critical trade details and provide a single, compact bullet point summary.
            
            Focus ONLY on the most relevant information:
            - Asset symbol/name
            - Transaction type (buy/sell)
            - Quantity
            - Price
            - Date (if provided)
            - Any critical settlement risk factor
            
            Format your ENTIRE response as a SINGLE bullet point with this exact structure:
            • [Asset] [Transaction Type] [Quantity] @ [Price] on [Date] - [One key settlement consideration]
            
            Examples:
            • AAPL Buy 100 shares @ $150 on 2023-10-15 - T+2 settlement pending
            • BTC Sell 2.5 @ $35,000 - Missing trade date may delay settlement
            
            Be extremely concise. Omit any information not provided. Do not use paragraphs or multiple bullet points.
            Keep your response under 100 characters whenever possible.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 150,
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
