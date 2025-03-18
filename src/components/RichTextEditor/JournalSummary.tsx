
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
      
      <div className="text-sm mt-2 whitespace-pre-wrap">
        {summary}
      </div>
    </Card>
  );
};

export default JournalSummary;
