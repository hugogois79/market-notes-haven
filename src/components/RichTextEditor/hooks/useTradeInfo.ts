
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
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);
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
        
        // Simulate current price changes
        // In a real app, this would be replaced with actual API calls
        const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
        const simulatedCurrentPrice = parsedEntryPrice * randomFactor;
        const formattedCurrentPrice = parseFloat(simulatedCurrentPrice.toFixed(2));
        setCurrentPrice(formattedCurrentPrice);
        
        // Calculate price change
        const priceChangeValue = formattedCurrentPrice - parsedEntryPrice;
        setPriceChange(parseFloat(priceChangeValue.toFixed(2)));
        
        // Calculate percentage change
        const percentChange = (priceChangeValue / parsedEntryPrice) * 100;
        setPriceChangePercent(parseFloat(percentChange.toFixed(2)));
        
        // Calculate profit/loss
        const parsedQuantity = parseFloat(quantity);
        const investmentValue = parsedEntryPrice * parsedQuantity;
        const currentValue = formattedCurrentPrice * parsedQuantity;
        const calculatedProfit = currentValue - investmentValue;
        setProfit(parseFloat(calculatedProfit.toFixed(2)));
      } catch (error) {
        setCurrentPrice(null);
        setPriceChange(null);
        setPriceChangePercent(null);
        setProfit(null);
      }
    } else {
      setCurrentPrice(null);
      setPriceChange(null);
      setPriceChangePercent(null);
      setProfit(null);
    }
  }, [selectedToken, quantity, entryPrice]);

  const handleTokenChange = (tokenId: string) => {
    setSelectedToken(tokenId);
    updateTradeInfo({ tokenId });
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    
    // Only update trade info if the value is valid or empty
    const numericValue = value === "" ? undefined : parseFloat(value);
    if (value === "" || !isNaN(numericValue)) {
      updateTradeInfo({ quantity: numericValue });
    }
  };

  const handleEntryPriceChange = (value: string) => {
    setEntryPrice(value);
    
    // Only update trade info if the value is valid or empty
    const numericValue = value === "" ? undefined : parseFloat(value);
    if (value === "" || !isNaN(numericValue)) {
      updateTradeInfo({ entryPrice: numericValue });
    }
  };

  const handleTargetPriceChange = (value: string) => {
    setTargetPrice(value);
    
    // Only update trade info if the value is valid or empty
    const numericValue = value === "" ? undefined : parseFloat(value);
    if (value === "" || !isNaN(numericValue)) {
      updateTradeInfo({ targetPrice: numericValue });
    }
  };

  const handleStopPriceChange = (value: string) => {
    setStopPrice(value);
    
    // Only update trade info if the value is valid or empty
    const numericValue = value === "" ? undefined : parseFloat(value);
    if (value === "" || !isNaN(numericValue)) {
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

  // Add function to refresh current price 
  const refreshCurrentPrice = () => {
    if (selectedToken && entryPrice) {
      try {
        const parsedEntryPrice = parseFloat(entryPrice);
        const randomFactor = 0.8 + Math.random() * 0.4;
        const simulatedCurrentPrice = parsedEntryPrice * randomFactor;
        const formattedCurrentPrice = parseFloat(simulatedCurrentPrice.toFixed(2));
        setCurrentPrice(formattedCurrentPrice);
        
        // Calculate price change
        const priceChangeValue = formattedCurrentPrice - parsedEntryPrice;
        setPriceChange(parseFloat(priceChangeValue.toFixed(2)));
        
        // Calculate percentage change
        const percentChange = (priceChangeValue / parsedEntryPrice) * 100;
        setPriceChangePercent(parseFloat(percentChange.toFixed(2)));
        
        // Recalculate profit if quantity exists
        if (quantity) {
          const parsedQuantity = parseFloat(quantity);
          const investmentValue = parsedEntryPrice * parsedQuantity;
          const currentValue = formattedCurrentPrice * parsedQuantity;
          const calculatedProfit = currentValue - investmentValue;
          setProfit(parseFloat(calculatedProfit.toFixed(2)));
        }
        
        toast.success("Price updated");
      } catch (error) {
        toast.error("Failed to update price");
      }
    } else {
      toast.info("Select a token and set entry price first");
    }
  };

  return {
    selectedToken,
    quantity,
    entryPrice,
    targetPrice,
    stopPrice,
    currentPrice,
    priceChange,
    priceChangePercent,
    profit,
    handleTokenChange,
    handleQuantityChange,
    handleEntryPriceChange,
    handleTargetPriceChange,
    handleStopPriceChange,
    handleGenerateTradeInfo,
    refreshCurrentPrice
  };
};
