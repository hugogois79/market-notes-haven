import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { CashflowItem, WealthTransaction, ConflictResolution } from "./types";

interface ConflictResolverProps {
  conflicts: Array<{
    snapshot: CashflowItem;
    current: WealthTransaction;
  }>;
  resolutions: ConflictResolution;
  onResolutionChange: (resolutions: ConflictResolution) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ConflictResolver({
  conflicts,
  resolutions,
  onResolutionChange,
}: ConflictResolverProps) {
  const handleSelect = (transactionId: string, choice: "snapshot" | "current") => {
    onResolutionChange({
      ...resolutions,
      [transactionId]: choice,
    });
  };

  const allResolved = conflicts.every(c => resolutions[c.snapshot.id]);
  const resolvedCount = conflicts.filter(c => resolutions[c.snapshot.id]).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Resolver Conflitos</h4>
        <Badge variant={allResolved ? "default" : "secondary"}>
          {resolvedCount}/{conflicts.length} resolvidos
        </Badge>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-auto">
        {conflicts.map((conflict) => {
          const selected = resolutions[conflict.snapshot.id];
          const difference = conflict.snapshot.amount - conflict.current.amount;
          
          return (
            <div 
              key={conflict.snapshot.id}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{conflict.snapshot.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(conflict.snapshot.date), "d MMMM yyyy", { locale: pt })}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    difference >= 0 ? "text-green-600" : "text-red-500"
                  )}
                >
                  {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selected === "snapshot" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-auto py-2 px-3 justify-start relative",
                    selected === "snapshot" && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSelect(conflict.snapshot.id, "snapshot")}
                >
                  {selected === "snapshot" && (
                    <Check className="h-3 w-3 absolute top-1 right-1" />
                  )}
                  <div className="text-left">
                    <div className="text-[10px] opacity-70 uppercase">Snapshot</div>
                    <div className={cn(
                      "font-bold",
                      conflict.snapshot.amount >= 0 ? "text-green-600" : "text-red-500"
                    )}>
                      {formatCurrency(conflict.snapshot.amount)}
                    </div>
                  </div>
                </Button>

                <Button
                  variant={selected === "current" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-auto py-2 px-3 justify-start relative",
                    selected === "current" && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSelect(conflict.snapshot.id, "current")}
                >
                  {selected === "current" && (
                    <Check className="h-3 w-3 absolute top-1 right-1" />
                  )}
                  <div className="text-left">
                    <div className="text-[10px] opacity-70 uppercase">Manter Actual</div>
                    <div className={cn(
                      "font-bold",
                      conflict.current.amount >= 0 ? "text-green-600" : "text-red-500"
                    )}>
                      {formatCurrency(conflict.current.amount)}
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
