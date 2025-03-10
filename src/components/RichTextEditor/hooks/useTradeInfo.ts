
import { useState, useEffect } from "react";
import { TradeInfo } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractTradeInfo } from "@/utils/tradeInfoExtractor";

interface UseTradeInfoProps {
  tradeInfo?: TradeInfo;
  noteContent?: string;
  availableTokens: Token[];
  onTradeInfoChange: (info: TradeInfo) => void;
}

export const useTradeInfo = ({ 
  tradeInfo, 
  noteContent, 
  availableTokens, 
  onTradeInfoChange 
}: UseTradeInfoProps) => {
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
        const parsedEntryPrice = parseFloat(entryPrice);
        const randomFactor = 0.8 + Math.random() * 0.4;
        const simulatedCurrentPrice = parsedEntryPrice * randomFactor;
        setCurrentPrice(parseFloat(simulatedCurrentPrice.toFixed(2)));
        
        const parsedQuantity = parseFloat(quantity);
        const investmentValue = parsedEntryPrice * parsedQuantity;
        const currentValue = simulatedCurrentPrice * parsedQuantity;
        const calculatedProfit = currentValue - investmentValue;
        setProfit(parseFloat(calculatedProfit.toFixed(2)));
      } catch (error) {
        setCurrentPrice(null);
        setProfit(null);
      }
    } else {
      setCurrentPrice(null);
      setProfit(null);
    }
  }, [selectedToken, quantity, entryPrice]);

  const handleTokenChange = (tokenId: string) => {
    setSelectedToken(tokenId);
    updateTradeInfo({ tokenId });
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const numericValue = value === "" ? undefined : parseFloat(value);
    updateTradeInfo({ quantity: !isNaN(Number(numericValue)) ? numericValue : undefined });
  };

  const handleEntryPriceChange = (value: string) => {
    setEntryPrice(value);
    const numericValue = value === "" ? undefined : parseFloat(value);
    updateTradeInfo({ entryPrice: !isNaN(Number(numericValue)) ? numericValue : undefined });
  };

  const handleTargetPriceChange = (value: string) => {
    setTargetPrice(value);
    const numericValue = value === "" ? undefined : parseFloat(value);
    updateTradeInfo({ targetPrice: !isNaN(Number(numericValue)) ? numericValue : undefined });
  };

  const handleStopPriceChange = (value: string) => {
    setStopPrice(value);
    const numericValue = value === "" ? undefined : parseFloat(value);
    updateTradeInfo({ stopPrice: !isNaN(Number(numericValue)) ? numericValue : undefined });
  };

  const updateTradeInfo = (updates: Partial<TradeInfo>) => {
    const updatedInfo: TradeInfo = {
      tokenId: selectedToken,
      quantity: quantity ? parseFloat(quantity) : undefined,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      ...updates
    };
    onTradeInfoChange(updatedInfo);
  };

  const handleGenerateTradeInfo = async () => {
    if (!noteContent || !availableTokens.length) return;

    const extractedInfo = extractTradeInfo(noteContent, availableTokens);
    let wasUpdated = false;
    let updatedInfo = { ...tradeInfo } as TradeInfo;
    
    // Update local info with extracted data
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

    try {
      const { data, error } = await supabase.functions.invoke('summarize-note', {
        body: { 
          content: noteContent,
          generateTradeInfo: true
        },
      });

      if (error) {
        console.error("Error extracting trade info:", error);
        return;
      }

      if (data?.tradeInfo) {
        if (data.tradeInfo.allTrades && data.tradeInfo.allTrades.length > 0) {
          const firstTrade = data.tradeInfo.allTrades[0];
          
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
        }
      }
    } catch (error) {
      console.error("Error calling Supabase function:", error);
    }

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
  };

  return {
    selectedToken,
    quantity,
    entryPrice,
    targetPrice,
    stopPrice,
    currentPrice,
    profit,
    handleTokenChange,
    handleQuantityChange,
    handleEntryPriceChange,
    handleTargetPriceChange,
    handleStopPriceChange,
    handleGenerateTradeInfo
  };
};
