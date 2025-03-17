
import { Token } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

interface TokenBadgeProps {
  token: Token;
  className?: string;
  size?: "default" | "sm";
}

const TokenBadge = ({ token, className, size = "default" }: TokenBadgeProps) => {
  // Determine classes based on size
  const badgeClasses = size === "sm" 
    ? "text-xs py-0 px-1.5 gap-1"
    : "px-2 py-0.5 gap-1.5";

  return (
    <Badge 
      variant="secondary" 
      className={`bg-[#1EAEDB] text-white hover:bg-[#1EAEDB]/80 flex items-center ${badgeClasses} ${className || ''}`}
    >
      <Coins size={size === "sm" ? 10 : 12} />
      {token.symbol}
    </Badge>
  );
};

export default TokenBadge;
