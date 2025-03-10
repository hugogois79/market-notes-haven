
import { Token } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Target, AlertTriangle, BarChart2 } from "lucide-react";

interface TradeInfoFormProps {
  availableTokens: Token[];
  isLoadingTokens: boolean;
  selectedToken: string;
  quantity: string;
  entryPrice: string;
  targetPrice: string;
  stopPrice: string;
  currentPrice: number | null;
  profit: number | null;
  onTokenChange: (tokenId: string) => void;
  onQuantityChange: (value: string) => void;
  onEntryPriceChange: (value: string) => void;
  onTargetPriceChange: (value: string) => void;
  onStopPriceChange: (value: string) => void;
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
  profit,
  onTokenChange,
  onQuantityChange,
  onEntryPriceChange,
  onTargetPriceChange,
  onStopPriceChange,
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
            onChange={(e) => onQuantityChange(e.target.value)}
            inputMode="decimal"
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
            onChange={(e) => onEntryPriceChange(e.target.value)}
            inputMode="decimal"
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
            onChange={(e) => onTargetPriceChange(e.target.value)}
            inputMode="decimal"
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
            onChange={(e) => onStopPriceChange(e.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="space-y-1">
          <Label htmlFor="currentPrice" className="flex items-center gap-1">
            <DollarSign size={14} className="text-muted-foreground" />
            Current Price
          </Label>
          <Input
            id="currentPrice"
            value={currentPrice !== null ? formatCurrency(currentPrice) : "-"}
            readOnly
            className="bg-muted/50 cursor-not-allowed"
          />
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
