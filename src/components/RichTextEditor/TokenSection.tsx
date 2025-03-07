
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X, Coins } from "lucide-react";
import { Token } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TokenSectionProps {
  selectedTokens: Token[];
  handleRemoveToken: (tokenId: string) => void;
  handleTokenSelect: (tokenId: string) => void;
  tokens: Token[];
  isLoadingTokens: boolean;
}

const TokenSection: React.FC<TokenSectionProps> = ({
  selectedTokens,
  handleRemoveToken,
  handleTokenSelect,
  tokens,
  isLoadingTokens
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Coins size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Linked Tokens</span>
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        {selectedTokens.map(token => (
          <Badge key={token.id} variant="secondary" className="px-3 py-1 text-sm gap-2">
            {token.symbol} - {token.name}
            <button onClick={() => handleRemoveToken(token.id)} className="opacity-70 hover:opacity-100">
              <X size={12} />
            </button>
          </Badge>
        ))}
        
        <Select onValueChange={handleTokenSelect}>
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Link token..." />
          </SelectTrigger>
          <SelectContent>
            {isLoadingTokens ? (
              <SelectItem value="loading" disabled>Loading tokens...</SelectItem>
            ) : tokens.length === 0 ? (
              <SelectItem value="none" disabled>No tokens available</SelectItem>
            ) : (
              tokens
                .filter(token => !selectedTokens.some(t => t.id === token.id))
                .map(token => (
                  <SelectItem key={token.id} value={token.id}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TokenSection;
