
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Wand2, RefreshCcw, Copy, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface AiResumeProps {
  noteId: string;
  content: string;
  initialSummary?: string;
  onSummaryGenerated?: (summary: string) => void;
}

const AiResume: React.FC<AiResumeProps> = ({ 
  noteId, 
  content, 
  initialSummary = "", 
  onSummaryGenerated 
}) => {
  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Initialize with the provided summary if available and not a new/temporary note
  useEffect(() => {
    // Only set summary from initialSummary if:
    // 1. initialSummary has content
    // 2. The note is not a new/temporary note
    if (initialSummary && !noteId.startsWith('temp-')) {
      // Check if initialSummary is JSON or regular text
      try {
        const parsedSummary = JSON.parse(initialSummary);
        // If it's JSON, extract the summary field
        if (parsedSummary && typeof parsedSummary === 'object' && parsedSummary.summary) {
          setSummary(parsedSummary.summary);
        } else {
          setSummary(initialSummary);
        }
      } catch (e) {
        // Not JSON, use as-is
        setSummary(initialSummary);
      }
    } else {
      // For new notes, ensure summary is empty
      setSummary("");
    }
  }, [initialSummary, noteId]);
  
  const generateSummary = async () => {
    if (!content.trim()) {
      toast.error("Please add some content to your note first.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Call the Supabase Edge Function to summarize the content
      const { data, error } = await supabase.functions.invoke('summarize-note', {
        body: { 
          content,
          noteId,
          maxLength: 250, // Allow for slightly longer summaries for financial analysis
          generateTradeInfo: true // Always generate trade info
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to generate summary');
      }
      
      // Extract the summary text from the response
      let summaryText = "";
      if (typeof data.summary === 'string') {
        summaryText = data.summary;
      } else if (data.summary && typeof data.summary === 'object' && data.summary.summary) {
        summaryText = data.summary.summary;
      }
      
      setSummary(summaryText);
      
      // Call the callback to update the parent component (but don't include hasConclusion anymore)
      if (onSummaryGenerated) {
        onSummaryGenerated(summaryText);
      }
      
      // Log the trade info to help with debugging
      if (data.tradeInfo) {
        console.log("AI generated trade info:", data.tradeInfo);
        
        if (data.tradeInfo.allTrades && data.tradeInfo.allTrades.length > 0) {
          console.log(`Extracted ${data.tradeInfo.allTrades.length} trade entries`);
          data.tradeInfo.allTrades.forEach((trade, index) => {
            console.log(`Trade ${index + 1}:`, trade);
          });
        }
        
        // If there's a token identified in the trades, ensure it's linked to the note
        if (data.tradeInfo.allTrades && data.tradeInfo.allTrades.length > 0) {
          const firstTrade = data.tradeInfo.allTrades[0];
          if (firstTrade && firstTrade.tokenName && !noteId.startsWith('temp-')) {
            // Look up the token by name or symbol to get its ID
            const { data: tokenData, error: tokenError } = await supabase
              .from('tokens')
              .select('id')
              .or(`name.ilike.%${firstTrade.tokenName}%,symbol.ilike.%${firstTrade.tokenName}%`)
              .limit(1);
              
            if (tokenError) {
              console.error("Error finding token:", tokenError);
            } else if (tokenData && tokenData.length > 0) {
              const tokenId = tokenData[0].id;
              console.log(`Found token ID ${tokenId} for ${firstTrade.tokenName}`);
              
              // Check if this token is already linked to the note
              const { data: existingLink, error: checkError } = await supabase
                .from('notes_tokens')
                .select('*')
                .eq('note_id', noteId)
                .eq('token_id', tokenId)
                .maybeSingle();
                
              if (checkError) {
                console.error("Error checking existing token link:", checkError);
              } else if (!existingLink) {
                // Link the token to the note
                const { error: linkError } = await supabase
                  .from('notes_tokens')
                  .insert({
                    note_id: noteId,
                    token_id: tokenId
                  });
                  
                if (linkError) {
                  console.error("Error linking token to note:", linkError);
                } else {
                  console.log(`Successfully linked token ${tokenId} to note ${noteId}`);
                  toast.success(`Token ${firstTrade.tokenName} linked to the note.`);
                }
              } else {
                console.log(`Token ${tokenId} already linked to note ${noteId}`);
              }
            } else {
              console.log(`No token found for '${firstTrade.tokenName}'`);
            }
          }
        }
      }
      
      toast.success("Financial summary generated and saved successfully!");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate financial summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-500" />
          <h3 className="font-medium text-blue-950">AI Summary</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={isGenerating}
          className="flex items-center gap-1 text-sm bg-white border-gray-200 hover:bg-gray-50"
        >
          {isGenerating ? (
            <>
              <RefreshCcw size={14} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 size={14} className="text-blue-500" />
              {summary ? "Regenerate summary" : "Generate financial summary"}
            </>
          )}
        </Button>
      </div>
      
      {summary ? (
        <Card className="relative p-4 bg-[#F1F0FB] border-0 rounded-md">
          <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
            {summary.split('**').map((part, index) => {
              // If the index is odd, it's a bold part
              return index % 2 === 1 ? (
                <strong key={index} className="text-blue-800">{part}</strong>
              ) : (
                <span key={index}>{part}</span>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 hover:bg-[#E3E1F6]"
            onClick={copyToClipboard}
          >
            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
          </Button>
        </Card>
      ) : (
        <div className="p-4 text-center bg-[#F1F0FB]/50 rounded-md">
          <p className="text-sm text-gray-600">
            Click "Generate financial summary" to create an AI-powered analysis of your financial notes.
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p>The AI summary highlights key metrics, trade recommendations, and financial insights from your notes and trade journal entries.</p>
      </div>
    </div>
  );
};

export default AiResume;
