
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface InvestorOpportunitiesHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

const InvestorOpportunitiesHeader: React.FC<InvestorOpportunitiesHeaderProps> = ({
  isLoading,
  onRefresh
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Investor Opportunities</h1>
        <p className="text-muted-foreground">
          Manage investment profiles, discover opportunities, and track performance
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
};

export default InvestorOpportunitiesHeader;
