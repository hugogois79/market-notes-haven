
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, RefreshCcw, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/tradeFormUtils";

interface CurrentPriceDisplayProps {
  currentPrice: number | null;
  priceChange?: number | null;
  priceChangePercent?: number | null;
  onRefreshPrice?: () => void;
}

export const CurrentPriceDisplay = ({
  currentPrice,
  priceChange = null,
  priceChangePercent = null,
  onRefreshPrice
}: CurrentPriceDisplayProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label htmlFor="currentPrice" className="flex items-center gap-1">
          <DollarSign size={14} className="text-muted-foreground" />
          Current Price
        </Label>
        
        {onRefreshPrice && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onRefreshPrice}
            className="h-6 w-6 p-0"
            title="Refresh price"
          >
            <RefreshCcw size={14} />
          </Button>
        )}
      </div>
      
      <div className="relative">
        <Input
          id="currentPrice"
          value={currentPrice !== null ? formatCurrency(currentPrice) : "-"}
          readOnly
          className="bg-muted/50 cursor-not-allowed pr-16"
        />
        {priceChange !== null && priceChangePercent !== null && (
          <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-xs font-semibold ${
            priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {priceChange > 0 ? (
              <TrendingUp size={12} className="mr-1" />
            ) : priceChange < 0 ? (
              <TrendingDown size={12} className="mr-1" />
            ) : null}
            {formatPercent(priceChangePercent)}
          </div>
        )}
      </div>
    </div>
  );
};
