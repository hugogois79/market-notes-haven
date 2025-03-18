
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
                  If the content is too short, unclear, or contains no financial information, respond with a general summary.
                  
                  Additionally, analyze if the content contains a proper conclusion section. If not, return hasConclusion: false in your response.`;
    
    // Add trade info extraction if requested
    if (generateTradeInfo) {
      systemPrompt += `

      Additionally, identify important trading information like:
      1. The specific cryptocurrency token/coin being traded (e.g. Bitcoin, Ethereum, BNB) 
      2. The quantity or position size mentioned (look for values like "5.0 BTC", "0.6 BTC", etc.)
      3. Entry price in USD (look for "entry zone", "entry price", "$79,800-$80,200", etc.)
      4. Target price in USD (look for "target", "target price", "tp", etc.)
      5. Stop loss price in USD (look for "stop loss", "sl", etc.)
      
      Pay careful attention to tables with trade data - they often contain the most accurate information.
      Look for rows with trading pairs, prices, and quantities.
      If there are numeric values with commas (like $1,000), remove the commas before converting to numbers.
      
      If there are multiple trades mentioned (like "SHORT 1", "SHORT 2", "LONG 1"), include ALL of them separately.
      When there's a range like "$75,800-$76,200", use the average value.
      
      Always return numbers as actual numbers (not strings).
      `;
    }

    // Add additional instruction for conclusion detection
    systemPrompt += `
    
    Check if the content has a proper conclusion section. Look for:
    1. A heading/title that explicitly contains the word "Conclusion" 
    2. OR a final paragraph that starts with "In conclusion", "To conclude", "To summarize", etc.
    3. OR a clear concluding statement that summarizes the key points
    
    Format your response as a string with your summary text.
    DO NOT return raw JSON - just provide a readable, nicely formatted summary.
    If you've been asked to extract trade info, include that in a separate field in your response but don't include it in the summary text.`;
    
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
        max_tokens: 700,  // Increased to handle more detailed extraction
        temperature: 0.2,  // Lowered to make responses more deterministic
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Failed to generate summary');
    }
    
    let summary = '';
    let hasConclusion = true; // Default to true so we don't interfere with existing content
    let tradeInfo = null;

    // Try to parse JSON from the response
    try {
      const rawResponse = data.choices[0].message.content.trim();
      
      // Try to parse as JSON first
      try {
        const parsedResponse = JSON.parse(rawResponse);
        summary = parsedResponse.summary || '';
        hasConclusion = parsedResponse.hasConclusion !== undefined ? parsedResponse.hasConclusion : true;
        
        // Process the AI's tradeInfo if present
        if (parsedResponse.tradeInfo) {
          tradeInfo = parsedResponse.tradeInfo;
          
          // Make sure allTrades is an array
          if (tradeInfo.allTrades && !Array.isArray(tradeInfo.allTrades)) {
            tradeInfo.allTrades = [tradeInfo.allTrades];
          }
          
          // Clean and normalize the data
          if (tradeInfo.allTrades) {
            tradeInfo.allTrades = tradeInfo.allTrades.map(trade => {
              if (!trade) return null;
              
              // Convert string numbers to actual numbers
              const cleanTrade = {
                tokenName: trade.tokenName || null,
                quantity: typeof trade.quantity === 'string' ? 
                  parseFloat(trade.quantity.replace(/,/g, '')) : trade.quantity,
                entryPrice: typeof trade.entryPrice === 'string' ? 
                  parseFloat(trade.entryPrice.replace(/[^0-9.]/g, '')) : trade.entryPrice,
                targetPrice: typeof trade.targetPrice === 'string' ? 
                  parseFloat(trade.targetPrice.replace(/[^0-9.]/g, '')) : trade.targetPrice,
                stopPrice: typeof trade.stopPrice === 'string' ? 
                  parseFloat(trade.stopPrice.replace(/[^0-9.]/g, '')) : trade.stopPrice
              };
              
              return cleanTrade;
            }).filter(Boolean);
          }
        }
      } catch (e) {
        // Not valid JSON, use as plain text
        summary = rawResponse;
      }
    } catch (e) {
      console.error('Error parsing response from OpenAI:', e);
      // If parsing fails, use the raw text as summary
      summary = data.choices[0].message.content.trim();
    }

    // If noteId is provided, save the summary to the database
    if (noteId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const updateData: any = { 
          summary,
          has_conclusion: hasConclusion
        };
        
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
          console.log('Summary and conclusion status successfully saved to note:', noteId);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue execution, don't throw an error since we have the summary
      }
    }

    return new Response(
      JSON.stringify({ summary, hasConclusion, tradeInfo }),
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
