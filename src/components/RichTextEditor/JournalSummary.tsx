import React from "react";
import { Card } from "@/components/ui/card";
import { LineChart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JournalSummaryProps {
  summary: string;
  onRefresh?: () => void;
}

const JournalSummary: React.FC<JournalSummaryProps> = ({ 
  summary, 
  onRefresh 
}) => {
  const formatBulletPoints = (text: string) => {
    if (!text) return <div className="text-muted-foreground text-sm italic">No journal summary yet. Start chatting to generate insights.</div>;
    
    // Split by lines and format as bullet points if not already
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      // If the line already starts with a bullet point or dash, use it as is
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        return <li key={index}>{trimmedLine.replace(/^[•\-*]\s*/, '')}</li>;
      }
      
      // Otherwise, format it as a bullet point
      return <li key={index}>{trimmedLine}</li>;
    });
  };

  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border p-4 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <LineChart className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium">Journal Summary</h3>
        </div>
        
        {onRefresh && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
      </div>
      
      <div className="text-sm mt-2">
        <ul className="list-disc pl-5 space-y-1">
          {formatBulletPoints(summary)}
        </ul>
      </div>
    </Card>
  );
};

export default JournalSummary;
