
import React, { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AiSummaryHeader from './AiSummaryHeader';
import SummaryDisplay from './SummaryDisplay';
import TradeTokenLinker from './TradeTokenLinker';
import { useSummaryParser } from './useSummaryParser';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [tradeInfo, setTradeInfo] = useState<any>(null);
  
  // Use custom hook to parse the summary
  const parsedSummary = useSummaryParser(initialSummary, noteId);
  
  // Helper to strip HTML tags and get plain text
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const generateSummary = async () => {
    if (!content.trim()) {
      toast.error("Please add some content to your note first.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Strip HTML to reduce content size and get plain text for summarization
      let plainTextContent = stripHtml(content).trim();
      
      if (!plainTextContent) {
        toast.error("No text content found to summarize.");
        setIsGenerating(false);
        return;
      }
      
      // Truncate content if it exceeds the limit (keep under 180k to be safe)
      const MAX_CONTENT_LENGTH = 180000;
      if (plainTextContent.length > MAX_CONTENT_LENGTH) {
        plainTextContent = plainTextContent.substring(0, MAX_CONTENT_LENGTH);
        console.log(`Content truncated from ${content.length} to ${MAX_CONTENT_LENGTH} characters`);
      }
      
      // Call the Supabase Edge Function to summarize the content
      const { data, error } = await supabase.functions.invoke('summarize-note', {
        body: { 
          content: plainTextContent,
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
      
      // Update the trade info if available
      if (data.tradeInfo) {
        console.log("AI generated trade info:", data.tradeInfo);
        setTradeInfo(data.tradeInfo);
      }
      
      // Call the callback to update the parent component with the new summary
      if (onSummaryGenerated) {
        onSummaryGenerated(summaryText);
      }
      
      toast.success("Financial summary generated and saved successfully!");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate financial summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <AiSummaryHeader
        isGenerating={isGenerating}
        hasSummary={!!parsedSummary}
        onGenerate={generateSummary}
      />
      
      <SummaryDisplay summary={parsedSummary} />
      
      {/* Token linking component (no visible UI) */}
      {tradeInfo && <TradeTokenLinker tradeInfo={tradeInfo} noteId={noteId} />}
      
      <div className="text-xs text-gray-500">
        <p>The AI summary highlights key metrics, trade recommendations, and financial insights from your notes and trade journal entries.</p>
      </div>
    </div>
  );
};

export default AiResume;
