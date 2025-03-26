
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X, Coins, ChevronDown } from "lucide-react";
import { Token } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { fetchTokens } from "@/services/tokenService";
import { useQuery } from "@tanstack/react-query";

interface TokenSectionProps {
  selectedTokens: Token[];
  handleRemoveToken: (tokenId: string) => void;
  handleTokenSelect: (token: Token | string) => void;
  isLoadingTokens: boolean;
  isFilter?: boolean; // New prop to indicate if this is used as a filter
  onFilterChange?: (tokenId: string | null) => void; // For single token filter
  selectedFilterToken?: string | null; // For single token filter
  onMultiFilterChange?: (tokenId: string) => void; // For multi-token filter
  selectedFilterTokens?: string[]; // For multi-token filter
  compact?: boolean; // New prop for compact mode
}

const TokenSection: React.FC<TokenSectionProps> = ({
  selectedTokens,
  handleRemoveToken,
  handleTokenSelect,
  isLoadingTokens,
  isFilter = false,
  onFilterChange,
  selectedFilterToken = null,
  onMultiFilterChange,
  selectedFilterTokens = [],
  compact = false
}) => {
  // Fetch all available tokens
  const { data: tokens = [] } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });
  
  const handleSelectToken = (tokenId: string) => {
    console.log("TokenSection - Token selected:", tokenId);
    
    // Multi-token filter mode
    if (isFilter && onMultiFilterChange) {
      onMultiFilterChange(tokenId);
      return;
    }
    
    // Single token filter mode
    if (isFilter && onFilterChange) {
      onFilterChange(tokenId === "all" ? null : tokenId);
      return;
    }
    
    // Normal token selection for linking to notes
    // Find the token object from the ID
    const tokenObj = tokens.find(t => t.id === tokenId);
    if (tokenObj) {
      console.log("Found token object:", tokenObj);
      handleTokenSelect(tokenObj);
    } else {
      console.error("Token not found with ID:", tokenId);
      handleTokenSelect(tokenId);
    }
    
    // Manually reset the select input by forcing a re-render with a key
    const selectElement = document.querySelector('.token-select') as HTMLElement;
    if (selectElement) {
      // Force blur to close the dropdown
      const selectTrigger = selectElement.querySelector('[data-radix-select-trigger]') as HTMLElement;
      if (selectTrigger) {
        selectTrigger.blur();
      }
    }
  };
  
  // Filter out tokens that are already selected (only for non-filter mode or multi-filter mode)
  const getAvailableTokens = () => {
    if (isFilter && selectedFilterTokens) {
      // For multi-token filter, exclude already selected tokens
      return tokens.filter(token => !selectedFilterTokens.includes(token.id));
    } else if (isFilter) {
      // For single-token filter, show all tokens
      return tokens;
    } else {
      // For regular token selection, exclude already selected tokens
      return tokens.filter(token => 
        !selectedTokens.some(selectedToken => selectedToken.id === token.id)
      );
    }
  };
  
  const availableTokens = getAvailableTokens();
  
  // Compact dropdown mode for filter or regular use
  if (compact) {
    const displayTokens = isFilter ? 
      (selectedFilterTokens?.map(id => tokens.find(t => t.id === id)).filter(Boolean) as Token[]) : 
      selectedTokens;
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2 mr-2">
          {displayTokens.map((token) => (
            <Badge 
              key={token.id} 
              variant="secondary" 
              className="px-3 py-1 text-xs gap-2 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/80"
            >
              {token.symbol} - {token.name}
              <button 
                onClick={() => isFilter && onMultiFilterChange ? 
                  onMultiFilterChange(token.id) : 
                  handleRemoveToken(token.id)
                } 
                className="text-white/70 hover:text-white"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 gap-1 font-normal"
              disabled={isLoadingTokens || availableTokens.length === 0}
            >
              <Coins size={14} />
              <span className="hidden sm:inline">{isFilter ? "Add Token Filters" : "Add Tokens"}</span>
              <ChevronDown size={14} className="opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>{isFilter ? "Filter by Tokens" : "Add Tokens"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {isLoadingTokens ? (
              <div className="px-2 py-3 text-sm text-center text-muted-foreground">Loading tokens...</div>
            ) : availableTokens.length === 0 ? (
              <div className="px-2 py-3 text-sm text-center text-muted-foreground">No more tokens available</div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {isFilter && onFilterChange && (
                  <DropdownMenuItem onClick={() => onFilterChange(null)}>
                    All Tokens
                  </DropdownMenuItem>
                )}
                
                {availableTokens.map(token => (
                  <DropdownMenuItem
                    key={token.id}
                    onClick={() => handleSelectToken(token.id)}
                    className="cursor-pointer"
                  >
                    <Coins size={12} className="mr-2 opacity-70" />
                    {token.symbol} - {token.name}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  // For normal mode or multi-filter mode (original code)
  if ((isFilter && onMultiFilterChange) || !isFilter) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Coins size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isFilter ? "Filter by Tokens" : "Linked Tokens"}
          </span>
        </div>
        
        {/* Selected tokens display */}
        <div className="flex flex-wrap gap-2 mb-2">
          {isFilter ? (
            // For filter mode, display selected filter tokens
            selectedFilterTokens.map(tokenId => {
              const token = tokens.find(t => t.id === tokenId);
              return token ? (
                <Badge 
                  key={token.id}
                  variant="secondary" 
                  className="px-3 py-1 text-xs gap-2 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/80"
                >
                  {token.symbol} - {token.name}
                  <button 
                    onClick={() => onMultiFilterChange(token.id)} 
                    className="text-white/70 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ) : null;
            })
          ) : (
            // For normal mode, display linked tokens
            selectedTokens.map(token => (
              <Badge 
                key={token.id} 
                variant="secondary" 
                className="px-3 py-1 text-xs gap-2 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/80"
              >
                {token.symbol} - {token.name}
                <button 
                  onClick={() => handleRemoveToken(token.id)} 
                  className="text-white/70 hover:text-white"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))
          )}
        </div>
        
        {/* Token selector */}
        <Select 
          onValueChange={handleSelectToken} 
          disabled={isLoadingTokens || availableTokens.length === 0}
          value="placeholder"
        >
          <SelectTrigger className="w-[180px] h-8 token-select">
            <SelectValue placeholder={isFilter ? "Add token filter..." : "Link token..."} />
          </SelectTrigger>
          <SelectContent>
            {isLoadingTokens ? (
              <SelectItem value="loading" disabled>Loading tokens...</SelectItem>
            ) : availableTokens.length === 0 ? (
              <SelectItem value="none" disabled>
                {isFilter ? "No more tokens available" : "No more tokens available"}
              </SelectItem>
            ) : (
              availableTokens.map(token => (
                <SelectItem key={token.id} value={token.id}>
                  {token.symbol} - {token.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  // For single-filter mode (legacy)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Coins size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Filter by Token
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        <Select 
          onValueChange={handleSelectToken} 
          disabled={isLoadingTokens || availableTokens.length === 0}
          value={selectedFilterToken || "all"}
        >
          <SelectTrigger className="w-[180px] h-8 token-select">
            <SelectValue placeholder="Select token..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tokens</SelectItem>
            {isLoadingTokens ? (
              <SelectItem value="loading" disabled>Loading tokens...</SelectItem>
            ) : availableTokens.length === 0 ? (
              <SelectItem value="none" disabled>No tokens available</SelectItem>
            ) : (
              availableTokens.map(token => (
                <SelectItem key={token.id} value={token.id}>
                  {token.symbol} - {token.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {selectedFilterToken && (
          <Badge 
            variant="secondary" 
            className="px-3 py-1 text-xs gap-2 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/80"
          >
            {tokens.find(t => t.id === selectedFilterToken)?.symbol} - {tokens.find(t => t.id === selectedFilterToken)?.name}
            <button 
              onClick={() => onFilterChange && onFilterChange(null)} 
              className="text-white/70 hover:text-white"
            >
              <X size={12} />
            </button>
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TokenSection;
