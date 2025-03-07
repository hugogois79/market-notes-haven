
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Wand2, RefreshCcw, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
      // Simulate API call to summarize content
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would be replaced with a real AI summary API call
      const generatedSummary = `This is an AI-generated summary of your note about ${
        content.length > 50 ? content.substring(0, 50) + "..." : content
      }. 
      
      The note discusses key points about the topic and provides insights into the matter. It covers various aspects and considerations that might be relevant to your research or documentation.`;
      
      setSummary(generatedSummary);
      toast.success("Summary generated successfully!");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary. Please try again.");
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
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Generate summary
            </>
          )}
        </Button>
      </div>
      
      {summary ? (
        <div className="bg-muted p-4 rounded-md relative">
          <p className="text-sm whitespace-pre-line">{summary}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={copyToClipboard}
          >
            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
          </Button>
        </div>
      ) : (
        <div className="bg-muted/50 p-4 rounded-md text-center">
          <p className="text-sm text-muted-foreground">
            Click "Generate summary" to create an AI-powered summary of your note.
          </p>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground">
        <p>The AI summary is generated based on the content of your note and helps you quickly understand the main points.</p>
      </div>
    </div>
  );
};

export default AiResume;
