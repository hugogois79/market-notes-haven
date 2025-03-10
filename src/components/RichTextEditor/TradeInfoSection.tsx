
import React from "react";
import { Token, TradeInfo } from "@/types";
import { TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTradeInfo } from "./hooks/useTradeInfo";
import { TradeInfoForm } from "./TradeInfoForm";

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
  const {
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
  } = useTradeInfo({
    tradeInfo,
    noteContent,
    availableTokens,
    onTradeInfoChange
  });

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

      <TradeInfoForm
        availableTokens={availableTokens}
        isLoadingTokens={isLoadingTokens}
        selectedToken={selectedToken}
        quantity={quantity}
        entryPrice={entryPrice}
        targetPrice={targetPrice}
        stopPrice={stopPrice}
        currentPrice={currentPrice}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
        profit={profit}
        onTokenChange={handleTokenChange}
        onQuantityChange={handleQuantityChange}
        onEntryPriceChange={handleEntryPriceChange}
        onTargetPriceChange={handleTargetPriceChange}
        onStopPriceChange={handleStopPriceChange}
        onRefreshPrice={refreshCurrentPrice}
      />
    </div>
  );
};

export default TradeInfoSection;
