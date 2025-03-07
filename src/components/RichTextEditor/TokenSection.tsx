
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
import { fetchTokens } from "@/services/tokenService";
import { useQuery } from "@tanstack/react-query";

interface TokenSectionProps {
  selectedTokens: Token[];
  handleRemoveToken: (tokenId: string) => void;
  handleTokenSelect: (tokenId: string) => void;
  isLoadingTokens: boolean;
}

const TokenSection: React.FC<TokenSectionProps> = ({
  selectedTokens,
  handleRemoveToken,
  handleTokenSelect,
  isLoadingTokens
}) => {
  // Fetch all available tokens
  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Coins size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Linked Tokens</span>
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        {selectedTokens.map(token => (
          <Badge key={token.id} variant="secondary" className="px-3 py-1 text-sm gap-2 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/80">
            {token.symbol} - {token.name}
            <button onClick={() => handleRemoveToken(token.id)} className="text-white/70 hover:text-white">
              <X size={12} />
            </button>
          </Badge>
        ))}
        
        <Select onValueChange={handleTokenSelect} disabled={isLoadingTokens}>
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
