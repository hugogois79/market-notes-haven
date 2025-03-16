
import { Badge } from "@/components/ui/badge";
import { Token } from "@/types";
import { CircleDollarSign } from "lucide-react";

interface TokenBadgeProps {
  token: Token;
  className?: string;
  showPrice?: boolean;
}

const TokenBadge = ({ token, className, showPrice = false }: TokenBadgeProps) => {
  return (
    <div className="inline-flex items-center gap-1">
      <Badge 
        variant="outline" 
        className={`text-xs px-2 py-0.5 whitespace-nowrap bg-[#1EAEDB] text-white hover:bg-[#1EAEDB]/90 flex items-center gap-1 ${className || ''}`}
      >
        <CircleDollarSign size={10} />
        {token.symbol}
      </Badge>
      
      {showPrice && token.current_price !== undefined && (
        <span className="text-xs text-green-600 font-medium flex items-center">
          ${token.current_price.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
          })}
        </span>
      )}
    </div>
  );
};

export default TokenBadge;
