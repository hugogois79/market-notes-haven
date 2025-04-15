
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TaoPageHeaderProps {
  timestamp?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const TaoPageHeader: React.FC<TaoPageHeaderProps> = ({ 
  timestamp, 
  isLoading, 
  onRefresh 
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
          <h1 className="text-2xl font-bold tracking-tight">Bittensor TAO Network</h1>
          <p className="text-muted-foreground">
            {timestamp ? 
              `Last updated: ${formatTimestamp(timestamp)}` : 
              'Live data dashboard'}
          </p>
        </div>
      </div>
      
      <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh Data
      </Button>
    </div>
  );
};

export default TaoPageHeader;
