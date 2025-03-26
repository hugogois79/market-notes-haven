
import { Token } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchTokens } from "@/services/tokenService";
import { toast } from "sonner";

export function useTokenHandling(linkedTokens: Token[], onTokensChange: (tokens: Token[]) => void) {
  const { data: availableTokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });

  const handleTokenSelect = (tokenOrId: Token | string) => {
    console.log("useTokenHandling: handleTokenSelect received:", tokenOrId);
    
    if (typeof tokenOrId === 'string') {
      const tokenId = tokenOrId;
      
      const token = availableTokens.find(t => t.id === tokenId);
      if (token) {
        console.log("useTokenHandling: Found token by ID:", token);
        const tokenExists = linkedTokens.some(t => t.id === token.id);
        if (!tokenExists) {
          const updatedTokens = [...linkedTokens, token];
          console.log("useTokenHandling: Updating tokens to:", updatedTokens);
          onTokensChange(updatedTokens);
        } else {
          toast.info("Token already linked to this note");
        }
      } else {
        console.error("useTokenHandling: Token not found with ID:", tokenId);
      }
    } else {
      const token = tokenOrId;
      const tokenExists = linkedTokens.some(t => t.id === token.id);
      if (!tokenExists) {
        const updatedTokens = [...linkedTokens, token];
        console.log("useTokenHandling: Updating tokens to:", updatedTokens);
        onTokensChange(updatedTokens);
      } else {
        toast.info("Token already linked to this note");
      }
    }
  };

  const handleRemoveToken = (tokenId: string) => {
    const updatedTokens = linkedTokens.filter(token => token.id !== tokenId);
    console.log("Removing token, updated tokens:", updatedTokens);
    onTokensChange(updatedTokens);
  };

  return {
    availableTokens,
    isLoadingTokens,
    handleTokenSelect,
    handleRemoveToken
  };
}
