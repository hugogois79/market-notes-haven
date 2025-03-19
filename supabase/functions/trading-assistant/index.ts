
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
  const { message, noteId, action } = await req.json();
  
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
    // Handle removal action if specified
    if (action === 'remove_bullet_point') {
      const { summaryText } = await req.json();
      if (!summaryText) {
        throw new Error('Summary text is required for removal action');
      }
      
      // Call OpenAI to process the removal request
      const removalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `You are a helpful assistant that processes journal summaries. 
              A user wants to remove a bullet point from their journal summary based on their natural language description.
              
              Current summary:
              ${summaryText}
              
              The user's request to remove: "${message}"
              
              Find the most relevant bullet point to remove based on the user's request. If you find a match, return the updated summary without that bullet point.
              If no bullet points match, return the original summary unchanged.
              
              Format your response as a clean set of bullet points, ONE per line, using the bullet character '•'. 
              DO NOT include any explanations or additional text.
              
              Example format:
              • First remaining bullet point
              • Second remaining bullet point`
            }
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });
      
      const removalData = await removalResponse.json();
      
      if (removalData.error) {
        throw new Error(removalData.error.message || 'Error calling OpenAI API');
      }
      
      const updatedSummary = removalData.choices[0].message.content;
      
      return new Response(
        JSON.stringify({ 
          response: "Bullet point removed from summary", 
          updatedSummary 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Standard chat processing for normal messages
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
            Extract the available trade details and provide a single, compact bullet point summary.
            
            Format your ENTIRE response as a SINGLE bullet point with this EXACT format:
            • [Asset] [Transaction Type] [Quantity] @ $[Price] - [T+X settlement status]
            
            Examples:
            • TAO Buy 403 units @ $239.65 - T+2 settlement pending
            • BTC Sell 2.5 @ $35,000 - T+2 settlement complete
            
            Be extremely concise. Always provide a meaningful response with whatever information is available.
            Do NOT mention "insufficient information" or "lack of information" in your response.
            If information is missing, fill in with reasonable assumptions or use placeholder text:
            • [Asset if known, otherwise "Unspecified Asset"] [Buy/Sell if known] [Quantity if known] @ $[Price if known] - [Settlement status if known]
            
            Examples with partial information:
            • TAO Buy @ $239.65 - Settlement pending
            • Unspecified Asset Trade - Profit recorded
            
            Don't add any additional text, explanations, or multiple bullet points.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.5,
        max_tokens: 100,
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
