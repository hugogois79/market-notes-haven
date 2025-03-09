
import { Badge } from "@/components/ui/badge";
import { Token } from "@/types";
import { DollarSign } from "lucide-react";

interface TokenBadgeProps {
  token: Token;
  className?: string;
  showPrice?: boolean;
}

const TokenBadge = ({ token, className, showPrice = false }: TokenBadgeProps) => {
  return (
    <div className="flex items-center gap-1">
      <Badge 
        variant="outline" 
        className={`text-xs px-1.5 py-0 whitespace-nowrap bg-[#0A3A5C] text-white ${className || ''}`}
      >
        {token.symbol}
      </Badge>
      
      {showPrice && token.current_price !== undefined && (
        <span className="text-xs text-green-600 font-medium flex items-center">
          <DollarSign size={10} className="mr-0.5" />
          {token.current_price.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
          })}
        </span>
      )}
    </div>
  );
};

export default TokenBadge;
