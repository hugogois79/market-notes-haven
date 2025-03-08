
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Token } from "@/types";
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
}

const TradeInfoSection: React.FC<TradeInfoSectionProps> = ({
  availableTokens,
  isLoadingTokens,
}) => {
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [entryPrice, setEntryPrice] = useState<string>("");

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
            onValueChange={setSelectedToken}
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
            onChange={(e) => setQuantity(e.target.value)}
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
            onChange={(e) => setEntryPrice(e.target.value)}
            min="0"
            step="any"
          />
        </div>
      </div>
    </div>
  );
};

export default TradeInfoSection;
