
import { Badge } from "@/components/ui/badge";
import { Token } from "@/types";

interface TokenBadgeProps {
  token: Token;
  className?: string;
}

const TokenBadge = ({ token, className }: TokenBadgeProps) => {
  return (
    <Badge 
      variant="outline" 
      className={`text-xs px-1.5 py-0 whitespace-nowrap bg-[#0A3A5C] text-white ${className || ''}`}
    >
      {token.symbol}
    </Badge>
  );
};

export default TokenBadge;
