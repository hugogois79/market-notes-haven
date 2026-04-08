
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BarChart2 } from "lucide-react";
import { formatCurrency } from "../utils/tradeFormUtils";

interface ProfitLossDisplayProps {
  profit: number | null;
}

export const ProfitLossDisplay = ({ profit }: ProfitLossDisplayProps) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="profit" className="flex items-center gap-1">
        <BarChart2 size={14} className="text-muted-foreground" />
        Profit/Loss
      </Label>
      <Input
        id="profit"
        value={profit !== null ? formatCurrency(profit) : "-"}
        readOnly
        className={`cursor-not-allowed ${
          profit === null ? "bg-muted/50" :
          profit > 0 ? "bg-green-50 text-green-700" : 
          profit < 0 ? "bg-red-50 text-red-700" : "bg-muted/50"
        }`}
      />
    </div>
  );
};
