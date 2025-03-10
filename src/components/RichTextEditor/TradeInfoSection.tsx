
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Token, TradeInfo } from "@/types";
import { TrendingUp, Search, DollarSign, BarChart2, Target, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { extractTradeInfo } from "@/utils/tradeInfoExtractor";
import { toast } from "sonner";

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
  const [targetPrice, setTargetPrice] = useState<string>(tradeInfo?.targetPrice?.toString() || "");
  const [stopPrice, setStopPrice] = useState<string>(tradeInfo?.stopPrice?.toString() || "");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [profit, setProfit] = useState<number | null>(null);

  // Update local state when tradeInfo prop changes
  useEffect(() => {
    if (tradeInfo) {
      setSelectedToken(tradeInfo.tokenId || "");
      setQuantity(tradeInfo.quantity?.toString() || "");
      setEntryPrice(tradeInfo.entryPrice?.toString() || "");
      setTargetPrice(tradeInfo.targetPrice?.toString() || "");
      setStopPrice(tradeInfo.stopPrice?.toString() || "");
    }
  }, [tradeInfo]);

  // Calculate current price and profit when token is selected
  useEffect(() => {
    if (selectedToken && quantity && entryPrice) {
      try {
        // This would be replaced with actual API call in production
        // For demo purposes, we're just simulating a random current price
        const parsedEntryPrice = parseFloat(entryPrice);
        const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
        const simulatedCurrentPrice = parsedEntryPrice * randomFactor;
        setCurrentPrice(parseFloat(simulatedCurrentPrice.toFixed(2)));
        
        // Calculate profit
        const parsedQuantity = parseFloat(quantity);
        const investmentValue = parsedEntryPrice * parsedQuantity;
        const currentValue = simulatedCurrentPrice * parsedQuantity;
        const calculatedProfit = currentValue - investmentValue;
        setProfit(parseFloat(calculatedProfit.toFixed(2)));
      } catch (error) {
        // Handle parsing errors gracefully
        setCurrentPrice(null);
        setProfit(null);
      }
    } else {
      setCurrentPrice(null);
      setProfit(null);
    }
  }, [selectedToken, quantity, entryPrice]);

  // Handle token selection
  const handleTokenChange = (tokenId: string) => {
    console.log("Token selected:", tokenId);
    setSelectedToken(tokenId);
    
    // Immediately update parent with new trade info
    const updatedTradeInfo: TradeInfo = {
      tokenId,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
    };
    
    onTradeInfoChange(updatedTradeInfo);
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = e.target.value;
    setQuantity(newQuantity);
    
    // Immediately update parent with new trade info
    const numericValue = newQuantity === "" ? undefined : parseFloat(newQuantity);
    
    const updatedTradeInfo: TradeInfo = {
      tokenId: selectedToken,
      quantity: !isNaN(Number(numericValue)) ? numericValue : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
    };
    
    onTradeInfoChange(updatedTradeInfo);
  };

  // Handle entry price change
  const handleEntryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEntryPrice = e.target.value;
    setEntryPrice(newEntryPrice);
    
    // Immediately update parent with new trade info
    const numericValue = newEntryPrice === "" ? undefined : parseFloat(newEntryPrice);
    
    const updatedTradeInfo: TradeInfo = {
      tokenId: selectedToken,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: !isNaN(Number(numericValue)) ? numericValue : undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
    };
    
    onTradeInfoChange(updatedTradeInfo);
  };

  // Handle target price change
  const handleTargetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTargetPrice = e.target.value;
    setTargetPrice(newTargetPrice);
    
    // Immediately update parent with new trade info
    const numericValue = newTargetPrice === "" ? undefined : parseFloat(newTargetPrice);
    
    const updatedTradeInfo: TradeInfo = {
      tokenId: selectedToken,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      targetPrice: !isNaN(Number(numericValue)) ? numericValue : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
    };
    
    onTradeInfoChange(updatedTradeInfo);
  };

  // Handle stop price change
  const handleStopPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStopPrice = e.target.value;
    setStopPrice(newStopPrice);
    
    // Immediately update parent with new trade info
    const numericValue = newStopPrice === "" ? undefined : parseFloat(newStopPrice);
    
    const updatedTradeInfo: TradeInfo = {
      tokenId: selectedToken,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopPrice: !isNaN(Number(numericValue)) ? numericValue : undefined,
    };
    
    onTradeInfoChange(updatedTradeInfo);
  };

  // Manually extract trade info from note content
  const handleGenerateTradeInfo = () => {
    if (!noteContent || !availableTokens.length) return;

    // Use our custom extractor first
    const extractedInfo = extractTradeInfo(noteContent, availableTokens);
    console.log("Extracted trade info:", extractedInfo);
    
    let wasUpdated = false;
    let updatedInfo = { ...tradeInfo } as TradeInfo;
    
    if (extractedInfo.tokenId) {
      updatedInfo.tokenId = extractedInfo.tokenId;
      wasUpdated = true;
    }
    
    if (extractedInfo.quantity) {
      updatedInfo.quantity = extractedInfo.quantity;
      wasUpdated = true;
    }
    
    if (extractedInfo.entryPrice) {
      updatedInfo.entryPrice = extractedInfo.entryPrice;
      wasUpdated = true;
    }
    
    if (extractedInfo.targetPrice) {
      updatedInfo.targetPrice = extractedInfo.targetPrice;
      wasUpdated = true;
    }
    
    if (extractedInfo.stopPrice) {
      updatedInfo.stopPrice = extractedInfo.stopPrice;
      wasUpdated = true;
    }
    
    // If our extractor didn't find everything, try using the AI to extract more
    if (!wasUpdated || !extractedInfo.tokenId || !extractedInfo.quantity) {
      // For better extraction, use AI through Supabase function
      supabase.functions.invoke('summarize-note', {
        body: { 
          content: noteContent,
          generateTradeInfo: true
        },
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error extracting trade info:", error);
          return;
        }
        
        if (data?.tradeInfo) {
          console.log("AI extracted trade info:", data.tradeInfo);
          
          // Check if we got an array of trades
          if (data.tradeInfo.allTrades && data.tradeInfo.allTrades.length > 0) {
            const firstTrade = data.tradeInfo.allTrades[0];
            
            // If AI found a token by name, try to match it with our tokens
            if (firstTrade.tokenName && !updatedInfo.tokenId) {
              const matchedToken = availableTokens.find(token => 
                token.name.toLowerCase() === firstTrade.tokenName.toLowerCase() ||
                token.symbol.toLowerCase() === firstTrade.tokenName.toLowerCase()
              );
              
              if (matchedToken) {
                updatedInfo.tokenId = matchedToken.id;
                wasUpdated = true;
              }
            }
            
            // Update other fields if needed
            if (firstTrade.quantity && !updatedInfo.quantity) {
              updatedInfo.quantity = firstTrade.quantity;
              wasUpdated = true;
            }
            
            if (firstTrade.entryPrice && !updatedInfo.entryPrice) {
              updatedInfo.entryPrice = firstTrade.entryPrice;
              wasUpdated = true;
            }
            
            if (firstTrade.targetPrice && !updatedInfo.targetPrice) {
              updatedInfo.targetPrice = firstTrade.targetPrice;
              wasUpdated = true;
            }
            
            if (firstTrade.stopPrice && !updatedInfo.stopPrice) {
              updatedInfo.stopPrice = firstTrade.stopPrice;
              wasUpdated = true;
            }
          } else {
            // Handle legacy format
            if (data.tradeInfo.tokenName && !updatedInfo.tokenId) {
              const matchedToken = availableTokens.find(token => 
                token.name.toLowerCase() === data.tradeInfo.tokenName.toLowerCase() ||
                token.symbol.toLowerCase() === data.tradeInfo.tokenName.toLowerCase()
              );
              
              if (matchedToken) {
                updatedInfo.tokenId = matchedToken.id;
                wasUpdated = true;
              }
            }
            
            // Update other fields from the base tradeInfo object
            if (data.tradeInfo.quantity && !updatedInfo.quantity) {
              updatedInfo.quantity = data.tradeInfo.quantity;
              wasUpdated = true;
            }
            
            if (data.tradeInfo.entryPrice && !updatedInfo.entryPrice) {
              updatedInfo.entryPrice = data.tradeInfo.entryPrice;
              wasUpdated = true;
            }
            
            if (data.tradeInfo.targetPrice && !updatedInfo.targetPrice) {
              updatedInfo.targetPrice = data.tradeInfo.targetPrice;
              wasUpdated = true;
            }
            
            if (data.tradeInfo.stopPrice && !updatedInfo.stopPrice) {
              updatedInfo.stopPrice = data.tradeInfo.stopPrice;
              wasUpdated = true;
            }
          }
          
          // Update the UI and parent component if we found something
          if (wasUpdated) {
            onTradeInfoChange(updatedInfo);
            setSelectedToken(updatedInfo.tokenId || "");
            setQuantity(updatedInfo.quantity?.toString() || "");
            setEntryPrice(updatedInfo.entryPrice?.toString() || "");
            setTargetPrice(updatedInfo.targetPrice?.toString() || "");
            setStopPrice(updatedInfo.stopPrice?.toString() || "");
            toast.success("Trade information extracted from note");
          }
        }
      });
    } else {
      // Update the form with what we extracted locally
      if (wasUpdated) {
        onTradeInfoChange(updatedInfo);
        setSelectedToken(updatedInfo.tokenId || "");
        setQuantity(updatedInfo.quantity?.toString() || "");
        setEntryPrice(updatedInfo.entryPrice?.toString() || "");
        setTargetPrice(updatedInfo.targetPrice?.toString() || "");
        setStopPrice(updatedInfo.stopPrice?.toString() || "");
        toast.success("Trade information extracted from note");
      } else {
        toast.info("No trade information found in note content");
      }
    }
  };

  // Format currency display
  const formatCurrency = (value: number | null): string => {
    if (value === null) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Find the current token's name and symbol for display
  const getTokenDisplay = () => {
    if (!selectedToken) return "Select token";
    const token = availableTokens.find(t => t.id === selectedToken);
    return token ? `${token.name} (${token.symbol})` : "Select token";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium flex items-center gap-1">
          <TrendingUp size={16} className="text-[#1EAEDB]" />
          <span>Trade Information</span>
        </div>
        
        <Button 
          onClick={handleGenerateTradeInfo} 
          variant="outline" 
          size="sm"
          className="gap-2"
          disabled={isLoadingTokens || !noteContent}
        >
          <Search size={14} />
          Extract from Note
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Token Selection */}
        <div className="space-y-1 col-span-2 md:col-span-1">
          <Label htmlFor="token">Token</Label>
          <Select
            value={selectedToken}
            onValueChange={handleTokenChange}
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
          <Label htmlFor="entryPrice" className="flex items-center gap-1">
            <DollarSign size={14} />
            Entry Price
          </Label>
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

        {/* Target Price Input */}
        <div className="space-y-1">
          <Label htmlFor="targetPrice" className="flex items-center gap-1">
            <Target size={14} />
            Target Price
          </Label>
          <Input
            id="targetPrice"
            type="number"
            placeholder="Enter target price"
            value={targetPrice}
            onChange={handleTargetPriceChange}
            min="0"
            step="any"
          />
        </div>

        {/* Stop Price Input */}
        <div className="space-y-1">
          <Label htmlFor="stopPrice" className="flex items-center gap-1">
            <AlertTriangle size={14} />
            Stop Price
          </Label>
          <Input
            id="stopPrice"
            type="number"
            placeholder="Enter stop price"
            value={stopPrice}
            onChange={handleStopPriceChange}
            min="0"
            step="any"
          />
        </div>
      </div>

      {/* Second row - Current price and profit */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Current Price (Non-editable) */}
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

        {/* Profit/Loss (Non-editable) */}
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
    </div>
  );
};

export default TradeInfoSection;
