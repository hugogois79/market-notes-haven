
import React from 'react';
import { Button } from "@/components/ui/button";
import { Wand2, RefreshCcw, Sparkles } from "lucide-react";

interface AiSummaryHeaderProps {
  isGenerating: boolean;
  hasSummary: boolean;
  onGenerate: () => void;
}

const AiSummaryHeader: React.FC<AiSummaryHeaderProps> = ({ 
  isGenerating, 
  hasSummary, 
  onGenerate
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-blue-500" />
        <h3 className="font-medium text-blue-950">AI Summary</h3>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
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
            {hasSummary ? "Regenerate summary" : "Generate financial summary"}
          </>
        )}
      </Button>
    </div>
  );
};

export default AiSummaryHeader;
