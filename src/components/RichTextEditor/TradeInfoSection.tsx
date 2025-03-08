
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Token, TradeInfo } from "@/types";
import { TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradeInfoSectionProps {
  availableTokens: Token[];
  isLoadingTokens: boolean;
  tradeInfo?: TradeInfo;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
  noteContent?: string;
}

const TradeInfoSection: React.FC<TradeInfoSectionProps> = ({
  availableTokens,
  isLoadingTokens,
  tradeInfo,
  onTradeInfoChange = () => {},
  noteContent,
}) => {
  const [selectedToken, setSelectedToken] = useState<string>(tradeInfo?.tokenId || "");
  const [quantity, setQuantity] = useState<string>(tradeInfo?.quantity?.toString() || "");
  const [entryPrice, setEntryPrice] = useState<string>(tradeInfo?.entryPrice?.toString() || "");

  // Update local state when tradeInfo prop changes
  useEffect(() => {
    if (tradeInfo) {
      setSelectedToken(tradeInfo.tokenId || "");
      setQuantity(tradeInfo.quantity?.toString() || "");
      setEntryPrice(tradeInfo.entryPrice?.toString() || "");
    }
  }, [tradeInfo]);

  // Handle token selection
  const handleTokenChange = (tokenId: string) => {
    setSelectedToken(tokenId);
    updateTradeInfo({
      tokenId,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
    });
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = e.target.value;
    setQuantity(newQuantity);
    updateTradeInfo({
      tokenId: selectedToken,
      quantity: newQuantity ? parseFloat(newQuantity) : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
    });
  };

  // Handle entry price change
  const handleEntryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEntryPrice = e.target.value;
    setEntryPrice(newEntryPrice);
    updateTradeInfo({
      tokenId: selectedToken,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: newEntryPrice ? parseFloat(newEntryPrice) : undefined,
    });
  };

  // Update the parent component with changes
  const updateTradeInfo = (newTradeInfo: TradeInfo) => {
    onTradeInfoChange(newTradeInfo);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium flex items-center gap-1 mb-2">
        <TrendingUp size={16} className="text-[#1EAEDB]" />
        <span>Trade Information</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Token Selection */}
        <div className="space-y-1">
          <Label htmlFor="token">Token</Label>
          <Select
            value={selectedToken}
            onValueChange={handleTokenChange}
            disabled={isLoadingTokens}
          >
            <SelectTrigger id="token" className="w-full">
              <SelectValue placeholder={isLoadingTokens ? "Loading tokens..." : "Select token"} />
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

        {/* Quantity Input */}
        <div className="space-y-1">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={handleQuantityChange}
            min="0"
            step="any"
          />
        </div>

        {/* Entry Price Input */}
        <div className="space-y-1">
          <Label htmlFor="entryPrice">Entry Price ($)</Label>
          <Input
            id="entryPrice"
            type="number"
            placeholder="Enter entry price"
            value={entryPrice}
            onChange={handleEntryPriceChange}
            min="0"
            step="any"
          />
        </div>
      </div>
    </div>
  );
};

export default TradeInfoSection;
