
import { Token } from "@/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTokenDisplay } from "../utils/tradeFormUtils";

interface TokenSelectorProps {
  availableTokens: Token[];
  isLoadingTokens: boolean;
  selectedToken: string;
  onTokenChange: (tokenId: string) => void;
}

export const TokenSelector = ({
  availableTokens,
  isLoadingTokens,
  selectedToken,
  onTokenChange
}: TokenSelectorProps) => {
  // Ensure selectedToken is never empty
  const safeSelectedToken = selectedToken || "placeholder";
  
  return (
    <div className="space-y-1 col-span-2 md:col-span-1">
      <Label htmlFor="token">Token</Label>
      <Select
        value={safeSelectedToken}
        onValueChange={onTokenChange}
        disabled={isLoadingTokens}
      >
        <SelectTrigger id="token" className="w-full">
          <SelectValue placeholder={isLoadingTokens ? "Loading tokens..." : "Select token"}>
            {getTokenDisplay(safeSelectedToken, availableTokens)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {/* Use a non-empty string for placeholder value */}
          {safeSelectedToken === "placeholder" && (
            <SelectItem value="placeholder">Select a token</SelectItem>
          )}
          
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
  );
};
