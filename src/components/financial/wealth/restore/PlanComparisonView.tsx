import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Plus, Minus, AlertTriangle, Equal } from "lucide-react";
import { ComparisonResult, CashflowItem, WealthTransaction } from "./types";

interface PlanComparisonViewProps {
  comparison: ComparisonResult;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

type ComparisonRowType = "added" | "removed" | "conflict" | "unchanged";

interface ComparisonRow {
  type: ComparisonRowType;
  description: string;
  date: string;
  snapshotAmount: number | null;
  currentAmount: number | null;
  id: string;
}

export default function PlanComparisonView({ comparison }: PlanComparisonViewProps) {
  const { onlyInSnapshot, onlyInCurrent, conflicts, unchanged } = comparison;

  // Build unified list
  const rows: ComparisonRow[] = [
    ...onlyInSnapshot.map((item): ComparisonRow => ({
      type: "added",
      description: item.description,
      date: item.date,
      snapshotAmount: item.amount,
      currentAmount: null,
      id: item.id,
    })),
    ...onlyInCurrent.map((item): ComparisonRow => ({
      type: "removed",
      description: item.description,
      date: item.date,
      snapshotAmount: null,
      currentAmount: item.amount,
      id: item.id,
    })),
    ...conflicts.map((c): ComparisonRow => ({
      type: "conflict",
      description: c.snapshot.description,
      date: c.snapshot.date,
      snapshotAmount: c.snapshot.amount,
      currentAmount: c.current.amount,
      id: c.snapshot.id,
    })),
    ...unchanged.map((item): ComparisonRow => ({
      type: "unchanged",
      description: item.description,
      date: item.date,
      snapshotAmount: item.amount,
      currentAmount: item.amount,
      id: item.id,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getRowStyles = (type: ComparisonRowType) => {
    switch (type) {
      case "added":
        return "bg-green-50 dark:bg-green-950/20";
      case "removed":
        return "bg-red-50 dark:bg-red-950/20";
      case "conflict":
        return "bg-amber-50 dark:bg-amber-950/20";
      default:
        return "";
    }
  };

  const getIcon = (type: ComparisonRowType) => {
    switch (type) {
      case "added":
        return <Plus className="h-3 w-3 text-green-600" />;
      case "removed":
        return <Minus className="h-3 w-3 text-red-500" />;
      case "conflict":
        return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      default:
        return <Equal className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getLabel = (type: ComparisonRowType) => {
    switch (type) {
      case "added":
        return "Novo";
      case "removed":
        return "Removido";
      case "conflict":
        return "Alterado";
      default:
        return "Igual";
    }
  };

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400">
          <Plus className="h-3 w-3 mr-1" />
          {onlyInSnapshot.length} novas
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400">
          <Minus className="h-3 w-3 mr-1" />
          {onlyInCurrent.length} removidas
        </Badge>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {conflicts.length} conflitos
        </Badge>
        <Badge variant="outline">
          <Equal className="h-3 w-3 mr-1" />
          {unchanged.length} iguais
        </Badge>
      </div>

      {/* Comparison Table */}
      <div className="rounded-md border max-h-[350px] overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow className="text-xs">
              <TableHead className="py-1.5 w-[70px]">Estado</TableHead>
              <TableHead className="py-1.5">Data</TableHead>
              <TableHead className="py-1.5">Descrição</TableHead>
              <TableHead className="text-right py-1.5">Snapshot</TableHead>
              <TableHead className="text-right py-1.5">Actual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                  Sem transações para comparar
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={cn("text-xs", getRowStyles(row.type))}
                >
                  <TableCell className="py-1">
                    <div className="flex items-center gap-1">
                      {getIcon(row.type)}
                      <span className="text-[10px]">{getLabel(row.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    {format(new Date(row.date), "d MMM", { locale: pt })}
                  </TableCell>
                  <TableCell className="py-1 max-w-[180px] truncate">
                    {row.description}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right py-1 font-medium",
                    row.snapshotAmount !== null && (
                      row.snapshotAmount >= 0 ? "text-green-600" : "text-red-500"
                    )
                  )}>
                    {row.snapshotAmount !== null ? formatCurrency(row.snapshotAmount) : "-"}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right py-1 font-medium",
                    row.currentAmount !== null && (
                      row.currentAmount >= 0 ? "text-green-600" : "text-red-500"
                    )
                  )}>
                    {row.currentAmount !== null ? formatCurrency(row.currentAmount) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
