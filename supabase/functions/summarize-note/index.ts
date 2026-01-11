
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  noteId: z.preprocess(
    (val) => (val === "" || val === null) ? undefined : val,
    z.string().uuid("Invalid note ID format").optional()
  ),
  maxLength: z.number().min(100).max(2000).default(500),
  summarizeTradeChat: z.boolean().default(false),
  formatAsBulletPoints: z.boolean().default(false),
  generateTradeInfo: z.boolean().default(false)
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse and validate input
    const requestData = await req.json();
    const validationResult = requestSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    let { 
      content, 
      noteId, 
      maxLength, 
      summarizeTradeChat, 
      formatAsBulletPoints,
      generateTradeInfo
    } = validationResult.data;
    
    // Truncate content if too long (OpenAI has token limits)
    const MAX_CONTENT_LENGTH = 100000;
    if (content.length > MAX_CONTENT_LENGTH) {
      console.log(`Content truncated from ${content.length} to ${MAX_CONTENT_LENGTH} characters`);
      content = content.substring(0, MAX_CONTENT_LENGTH);
    }
    
    let systemPrompt = summarizeTradeChat
      ? `You are an AI assistant specializing in trading journal analysis. Summarize the following trading journal entries, focusing on key insights, strategies, and patterns.`
      : `You are an AI assistant that summarizes content. Create a concise summary of the provided text.`;
    
    // Add bullet point formatting instruction if requested
    if (formatAsBulletPoints) {
      systemPrompt += ` Format your summary as 3-5 bullet points, each starting with '- ' and focusing on the most important aspects.`;
    }
    
    systemPrompt += ` The summary should be no longer than ${maxLength} characters.`;
    
    // Add trade info extraction if requested
    let tradeInfoPrompt = "";
    if (generateTradeInfo) {
      tradeInfoPrompt = `Additionally, extract any trading information such as token names, trade entry prices, exit prices, trade direction (buy/sell), and any mentioned profit/loss percentages. Return this information separately.`;
      systemPrompt += " " + tradeInfoPrompt;
    }
    
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
    
    const assistantResponse = data.choices[0].message.content;
    console.log("Generated response:", assistantResponse);
    
    // Check if the note content includes a conclusion paragraph
    const hasConclusion = content.toLowerCase().includes('conclusion') || 
                         content.toLowerCase().includes('in summary') ||
                         content.toLowerCase().includes('to summarize');
    
    // Parse the response to separate summary and trade info
    let summary = assistantResponse;
    let tradeInfo = null;
    
    if (generateTradeInfo) {
      // Extract trading information if available
      const tradeRegex = /token names?:?\s*([^,\.]+)|entry price:?\s*([^,\.]+)|exit price:?\s*([^,\.]+)|profit\/loss:?\s*([^,\.]+)|trade direction:?\s*([^,\.]+)/gi;
      const matches = [...assistantResponse.matchAll(tradeRegex)];
      
      if (matches.length > 0) {
        tradeInfo = {
          allTrades: []
        };
        
        // Basic extraction - in a real app, this would be more sophisticated
        const tokenNameMatch = assistantResponse.match(/token (?:name|symbol):?\s*([^,\.]+)/i);
        const entryPriceMatch = assistantResponse.match(/entry price:?\s*\$?([0-9\.]+)/i);
        const exitPriceMatch = assistantResponse.match(/exit price:?\s*\$?([0-9\.]+)/i);
        const profitLossMatch = assistantResponse.match(/profit\/loss:?\s*([^,\.]+)/i);
        const directionMatch = assistantResponse.match(/(?:trade )?direction:?\s*(buy|sell)/i);
        
        if (tokenNameMatch || entryPriceMatch || exitPriceMatch || profitLossMatch || directionMatch) {
          tradeInfo.allTrades.push({
            tokenName: tokenNameMatch ? tokenNameMatch[1].trim() : undefined,
            entryPrice: entryPriceMatch ? entryPriceMatch[1].trim() : undefined,
            exitPrice: exitPriceMatch ? exitPriceMatch[1].trim() : undefined,
            profitLoss: profitLossMatch ? profitLossMatch[1].trim() : undefined,
            direction: directionMatch ? directionMatch[1].trim() : undefined,
          });
        }
      }
      
      // For clarity, separate the summary from any extracted trade info
      summary = assistantResponse.split(/(\bTrade info:|Trading information:|Extracted trade data:)/i)[0].trim();
    }
    
    // Return the summary, trade info, and conclusion flag
    return new Response(
      JSON.stringify({ summary, tradeInfo, hasConclusion }),
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
