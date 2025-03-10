import { useState, useEffect } from "react";
import { TradeInfo, Token } from "@/types";
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
    // Remove any non-numeric characters except for decimal point
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    
    // Handle multiple decimal points (keep only the first one)
    const parts = sanitizedValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    
    setQuantity(formattedValue);
    
    // Only update trade info if the value is valid
    const numericValue = formattedValue === "" ? undefined : parseFloat(formattedValue);
    if (formattedValue === "" || !isNaN(numericValue)) {
      updateTradeInfo({ quantity: numericValue });
    }
  };

  const handleEntryPriceChange = (value: string) => {
    // Remove any non-numeric characters except for decimal point
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    
    // Handle multiple decimal points (keep only the first one)
    const parts = sanitizedValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    
    setEntryPrice(formattedValue);
    
    // Only update trade info if the value is valid
    const numericValue = formattedValue === "" ? undefined : parseFloat(formattedValue);
    if (formattedValue === "" || !isNaN(numericValue)) {
      updateTradeInfo({ entryPrice: numericValue });
    }
  };

  const handleTargetPriceChange = (value: string) => {
    // Remove any non-numeric characters except for decimal point
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    
    // Handle multiple decimal points (keep only the first one)
    const parts = sanitizedValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    
    setTargetPrice(formattedValue);
    
    // Only update trade info if the value is valid
    const numericValue = formattedValue === "" ? undefined : parseFloat(formattedValue);
    if (formattedValue === "" || !isNaN(numericValue)) {
      updateTradeInfo({ targetPrice: numericValue });
    }
  };

  const handleStopPriceChange = (value: string) => {
    // Remove any non-numeric characters except for decimal point
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    
    // Handle multiple decimal points (keep only the first one)
    const parts = sanitizedValue.split('.');
    const formattedValue = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    
    setStopPrice(formattedValue);
    
    // Only update trade info if the value is valid
    const numericValue = formattedValue === "" ? undefined : parseFloat(formattedValue);
    if (formattedValue === "" || !isNaN(numericValue)) {
      updateTradeInfo({ stopPrice: numericValue });
    }
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

    // First try local extraction
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
      // Then try AI-powered extraction for more complex cases
      const { data, error } = await supabase.functions.invoke('summarize-note', {
        body: { 
          content: noteContent,
          generateTradeInfo: true
        },
      });

      if (error) {
        console.error("Error extracting trade info:", error);
      } else if (data?.tradeInfo) {
        if (data.tradeInfo.allTrades && data.tradeInfo.allTrades.length > 0) {
          // Use the first trade by default
          const firstTrade = data.tradeInfo.allTrades[0];
          
          // Look up token ID based on name or symbol
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
          
          // Update quantity if found and not already set
          if (firstTrade.quantity !== null && firstTrade.quantity !== undefined && !updatedInfo.quantity) {
            const qty = parseFloat(String(firstTrade.quantity));
            if (!isNaN(qty)) {
              updatedInfo.quantity = qty;
              wasUpdated = true;
            }
          }
          
          // Update entry price if found and not already set
          if (firstTrade.entryPrice !== null && firstTrade.entryPrice !== undefined && !updatedInfo.entryPrice) {
            const price = parseFloat(String(firstTrade.entryPrice));
            if (!isNaN(price)) {
              updatedInfo.entryPrice = price;
              wasUpdated = true;
            }
          }
          
          // Update target price if found and not already set
          if (firstTrade.targetPrice !== null && firstTrade.targetPrice !== undefined && !updatedInfo.targetPrice) {
            const price = parseFloat(String(firstTrade.targetPrice));
            if (!isNaN(price)) {
              updatedInfo.targetPrice = price;
              wasUpdated = true;
            }
          }
          
          // Update stop price if found and not already set
          if (firstTrade.stopPrice !== null && firstTrade.stopPrice !== undefined && !updatedInfo.stopPrice) {
            const price = parseFloat(String(firstTrade.stopPrice));
            if (!isNaN(price)) {
              updatedInfo.stopPrice = price;
              wasUpdated = true;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error calling Supabase function:", error);
    }

    if (wasUpdated) {
      // Update the UI state
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
