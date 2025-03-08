
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Wand2, RefreshCcw, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface AiResumeProps {
  noteId: string;
  content: string;
}

const AiResume: React.FC<AiResumeProps> = ({ noteId, content }) => {
  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
          maxLength: 250 // Allow for slightly longer summaries for financial analysis
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to generate summary');
      }
      
      setSummary(data.summary);
      toast.success("Financial summary generated successfully!");
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
          <Wand2 size={16} className="text-brand" />
          <h3 className="font-medium">AI Summary</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={isGenerating}
          className="flex items-center gap-1"
        >
          {isGenerating ? (
            <>
              <RefreshCcw size={14} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Generate financial summary
            </>
          )}
        </Button>
      </div>
      
      {summary ? (
        <Card className="bg-muted p-4 rounded-md relative">
          <p className="text-sm whitespace-pre-line">{summary}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={copyToClipboard}
          >
            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
          </Button>
        </Card>
      ) : (
        <div className="bg-muted/50 p-4 rounded-md text-center">
          <p className="text-sm text-muted-foreground">
            Click "Generate financial summary" to create an AI-powered analysis of your financial notes.
          </p>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        <p>The AI summary analyzes your financial notes to extract key insights, trade recommendations, and important values.</p>
      </div>
    </div>
  );
};

export default AiResume;
