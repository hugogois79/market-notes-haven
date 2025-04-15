
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaoPageHeaderProps {
  timestamp?: string;
  isLoading: boolean;
  onRefresh: () => void;
  isMockData?: boolean;
}

const TaoPageHeader: React.FC<TaoPageHeaderProps> = ({ 
  timestamp, 
  isLoading, 
  onRefresh,
  isMockData = false
}) => {
  // Format timestamp
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center rounded-full w-10 h-10">
          <img 
            src="/lovable-uploads/5bace84a-516c-4734-a925-c14b4b49b2a3.png" 
            alt="Bittensor TAO" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bittensor TAO Network</h1>
            {isMockData && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Demo Mode
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Using demo data. API connection unavailable.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-muted-foreground">
            {timestamp ? 
              `Last updated: ${formatTimestamp(timestamp)}` : 
              'Live data dashboard'}
          </p>
        </div>
      </div>
      
      <Button 
        onClick={onRefresh} 
        disabled={isLoading} 
        variant="outline" 
        size="sm"
        className={isMockData ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : ""}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "Refreshing..." : "Refresh Data"}
      </Button>
    </div>
  );
};

export default TaoPageHeader;
