
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

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
    const { content, noteId, maxLength = 150, generateTradeInfo = false } = await req.json();
    
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
    
    // Build system prompt based on request
    let systemPrompt = `You are a financial analyst assistant that generates concise summaries. 
                  Keep summaries under ${maxLength} characters.
                  Focus on extracting key financial insights, trade recommendations, asset values, and important conclusions.
                  Highlight specific numbers, percentages, trends, and actionable trading information when present.
                  Use professional financial terminology.
                  Format important values, names, tokens, percentages, and trade recommendations by enclosing them in double asterisks, like **this**.
                  Example: "**Token XYZ** price increased by **25%** with a recommendation to **buy** at **$100**."
                  Start with the most critical financial information.
                  Do not use introductory phrases like "This note discusses" or "This is about".
                  If the content is too short, unclear, or contains no financial information, respond with a general summary.`;
    
    // Add trade info extraction if requested
    if (generateTradeInfo) {
      systemPrompt += `

      Additionally, identify important trading information like:
      1. The specific cryptocurrency token/coin being traded (e.g. Bitcoin, Ethereum, BNB) 
      2. The quantity or position size mentioned
      3. Entry price in USD
      4. Target price in USD (if mentioned)
      5. Stop loss price in USD (if mentioned)
      
      Pay careful attention to tables with trade data - they often contain the most accurate information.
      Look for rows with trading pairs, prices, and quantities.
      If multiple trades are mentioned, include ALL of them separately in the response.
      
      Format your response as JSON with "summary" and "tradeInfo" fields:
      {
        "summary": "your summary here",
        "tradeInfo": [
          {
            "token": "token name if found or null",
            "quantity": number or null,
            "entryPrice": number in USD or null,
            "targetPrice": number in USD or null,
            "stopPrice": number in USD or null
          },
          {
            "token": "another token if multiple are mentioned",
            "quantity": number or null,
            "entryPrice": number in USD or null,
            "targetPrice": number in USD or null,
            "stopPrice": number in USD or null
          }
        ]
      }`;
    }
    
    // Make the request to OpenAI API
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
            content: systemPrompt
          },
          { role: 'user', content: `Analyze this financial note, paying special attention to trading information and tables with trade data: ${cleanContent}` }
        ],
        max_tokens: 500,  // Increased to handle more detailed extraction
        temperature: 0.3,  // Lowered to make responses more deterministic
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Failed to generate summary');
    }
    
    let summary = data.choices[0].message.content.trim();
    let tradeInfo = null;

    // Try to parse JSON if that's the response format (when generating trade info)
    if (generateTradeInfo && summary.startsWith('{') && summary.endsWith('}')) {
      try {
        const parsedResponse = JSON.parse(summary);
        summary = parsedResponse.summary;
        
        // Convert the AI's tradeInfo to our expected structure
        if (parsedResponse.tradeInfo) {
          // Handle both array and single object formats
          const tradeInfoArray = Array.isArray(parsedResponse.tradeInfo) 
            ? parsedResponse.tradeInfo 
            : [parsedResponse.tradeInfo];
          
          // Use the first trade info by default (for backward compatibility)
          tradeInfo = {
            tokenId: null, // We'll need to look up the token ID on the client side
            quantity: tradeInfoArray[0]?.quantity || null,
            entryPrice: tradeInfoArray[0]?.entryPrice || null,
            targetPrice: tradeInfoArray[0]?.targetPrice || null,
            stopPrice: tradeInfoArray[0]?.stopPrice || null
          };
          
          // Also include the token name/symbol for client-side lookup
          if (tradeInfoArray[0]?.token) {
            tradeInfo.tokenName = tradeInfoArray[0].token;
          }
          
          // Include the full array for multiple trade info
          tradeInfo.allTrades = tradeInfoArray.map(trade => ({
            tokenName: trade.token || null,
            quantity: trade.quantity || null,
            entryPrice: trade.entryPrice || null,
            targetPrice: trade.targetPrice || null,
            stopPrice: trade.stopPrice || null
          }));
        }
      } catch (e) {
        console.error('Error parsing JSON from OpenAI:', e);
        // Keep the summary as is if parsing fails
      }
    }

    // If noteId is provided, save the summary to the database
    if (noteId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const updateData: any = { summary };
        
        // Add trade_info if we have it
        if (tradeInfo) {
          updateData.trade_info = tradeInfo;
        }
        
        const { error: updateError } = await supabase
          .from('notes')
          .update(updateData)
          .eq('id', noteId);
          
        if (updateError) {
          console.error('Error saving summary to note:', updateError);
          // Continue execution, don't throw an error since we have the summary
        } else {
          console.log('Summary and trade info successfully saved to note:', noteId);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue execution, don't throw an error since we have the summary
      }
    }

    return new Response(
      JSON.stringify({ summary, tradeInfo }),
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
