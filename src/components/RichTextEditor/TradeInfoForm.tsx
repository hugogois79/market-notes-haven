
import { Token } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Target, AlertTriangle, BarChart2, RefreshCcw, TrendingUp, TrendingDown } from "lucide-react";

interface TradeInfoFormProps {
  availableTokens: Token[];
  isLoadingTokens: boolean;
  selectedToken: string;
  quantity: string;
  entryPrice: string;
  targetPrice: string;
  stopPrice: string;
  currentPrice: number | null;
  priceChange?: number | null;
  priceChangePercent?: number | null;
  profit: number | null;
  onTokenChange: (tokenId: string) => void;
  onQuantityChange: (value: string) => void;
  onEntryPriceChange: (value: string) => void;
  onTargetPriceChange: (value: string) => void;
  onStopPriceChange: (value: string) => void;
  onRefreshPrice?: () => void;
}

export const TradeInfoForm = ({
  availableTokens,
  isLoadingTokens,
  selectedToken,
  quantity,
  entryPrice,
  targetPrice,
  stopPrice,
  currentPrice,
  priceChange = null,
  priceChangePercent = null,
  profit,
  onTokenChange,
  onQuantityChange,
  onEntryPriceChange,
  onTargetPriceChange,
  onStopPriceChange,
  onRefreshPrice,
}: TradeInfoFormProps) => {
  const getTokenDisplay = () => {
    if (!selectedToken) return "Select token";
    const token = availableTokens.find(t => t.id === selectedToken);
    return token ? `${token.name} (${token.symbol})` : "Select token";
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  const formatPercent = (value: number | null): string => {
    if (value === null) return "-";
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleNumericInput = (value: string, onChange: (value: string) => void) => {
    // Allow empty string, digits, and one decimal point
    const numericRegex = /^(\d*\.?\d*)$/;
    
    if (value === '' || numericRegex.test(value)) {
      onChange(value);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="space-y-1 col-span-2 md:col-span-1">
          <Label htmlFor="token">Token</Label>
          <Select
            value={selectedToken}
            onValueChange={onTokenChange}
            disabled={isLoadingTokens}
          >
            <SelectTrigger id="token" className="w-full">
              <SelectValue placeholder={isLoadingTokens ? "Loading tokens..." : "Select token"}>
                {getTokenDisplay()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {availableTokens.map((token) => (
                <SelectItem key={token.id} value={token.id}>
                  <div className="flex items-center gap-2">
                    {token.logo_url && (
                      <img
                        src={token.logo_url}
                        alt={token.name}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span>{token.name} ({token.symbol})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="text"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => handleNumericInput(e.target.value, onQuantityChange)}
            inputMode="decimal"
            className="font-mono"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="entryPrice" className="flex items-center gap-1">
            <DollarSign size={14} />
            Entry Price
          </Label>
          <Input
            id="entryPrice"
            type="text"
            placeholder="Enter entry price"
            value={entryPrice}
            onChange={(e) => handleNumericInput(e.target.value, onEntryPriceChange)}
            inputMode="decimal"
            className="font-mono"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="targetPrice" className="flex items-center gap-1">
            <Target size={14} />
            Target Price
          </Label>
          <Input
            id="targetPrice"
            type="text"
            placeholder="Enter target price"
            value={targetPrice}
            onChange={(e) => handleNumericInput(e.target.value, onTargetPriceChange)}
            inputMode="decimal"
            className="font-mono"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="stopPrice" className="flex items-center gap-1">
            <AlertTriangle size={14} />
            Stop Price
          </Label>
          <Input
            id="stopPrice"
            type="text"
            placeholder="Enter stop price"
            value={stopPrice}
            onChange={(e) => handleNumericInput(e.target.value, onStopPriceChange)}
            inputMode="decimal"
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
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

        <div className="space-y-1">
          <Label htmlFor="profit" className="flex items-center gap-1">
            <BarChart2 size={14} className="text-muted-foreground" />
            Profit/Loss
          </Label>
          <Input
            id="profit"
            value={profit !== null ? formatCurrency(profit) : "-"}
            readOnly
            className={`cursor-not-allowed ${
              profit === null ? "bg-muted/50" :
              profit > 0 ? "bg-green-50 text-green-700" : 
              profit < 0 ? "bg-red-50 text-red-700" : "bg-muted/50"
            }`}
          />
        </div>
      </div>
    </>
  );
};
