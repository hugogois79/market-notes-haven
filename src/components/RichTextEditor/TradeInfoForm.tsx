
import { Token } from "@/types";
import { DollarSign, Target, AlertTriangle } from "lucide-react";
import { 
  TokenSelector, 
  TradeInputField,
  CurrentPriceDisplay,
  ProfitLossDisplay
} from "./TradeForm";

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
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <TokenSelector
          availableTokens={availableTokens}
          isLoadingTokens={isLoadingTokens}
          selectedToken={selectedToken}
          onTokenChange={onTokenChange}
        />

        <TradeInputField
          id="quantity"
          label="Quantity"
          value={quantity}
          placeholder="Enter quantity"
          onChange={onQuantityChange}
        />

        <TradeInputField
          id="entryPrice"
          label="Entry Price"
          value={entryPrice}
          placeholder="Enter entry price"
          onChange={onEntryPriceChange}
          icon={DollarSign}
        />

        <TradeInputField
          id="targetPrice"
          label="Target Price"
          value={targetPrice}
          placeholder="Enter target price"
          onChange={onTargetPriceChange}
          icon={Target}
        />

        <TradeInputField
          id="stopPrice"
          label="Stop Price"
          value={stopPrice}
          placeholder="Enter stop price"
          onChange={onStopPriceChange}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <CurrentPriceDisplay
          currentPrice={currentPrice}
          priceChange={priceChange}
          priceChangePercent={priceChangePercent}
          onRefreshPrice={onRefreshPrice}
        />

        <ProfitLossDisplay profit={profit} />
      </div>
    </>
  );
};
