import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Circle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import WealthTransactionDialog from "./WealthTransactionDialog";

type ColorOption = "none" | "green" | "blue" | "amber" | "red" | "purple";

const COLOR_OPTIONS: { value: ColorOption; label: string; bg: string; text: string }[] = [
  { value: "none", label: "Sem cor", bg: "", text: "" },
  { value: "green", label: "Verde", bg: "bg-emerald-100", text: "text-emerald-700" },
  { value: "blue", label: "Azul", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "amber", label: "Amarelo", bg: "bg-amber-100", text: "text-amber-700" },
  { value: "red", label: "Vermelho", bg: "bg-red-100", text: "text-red-700" },
  { value: "purple", label: "Roxo", bg: "bg-purple-100", text: "text-purple-700" },
];

type WealthTransaction = {
  id: string;
  date: string;
  counterparty: string | null;
  description: string;
  amount: number;
  transaction_type: string;
  category: string | null;
  notes: string | null;
  created_at: string;
  asset_id: string | null;
  affects_asset_value: boolean | null;
  wealth_assets: { name: string } | null;
};

type SortField = "date" | "amount" | "counterparty" | "category";
type SortDirection = "asc" | "desc";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
};

// Inline editable cell component
function EditableCell({
  value,
  onSave,
  type = "text",
  className,
}: {
  value: string;
  onSave: (newValue: string) => void;
  type?: "text" | "number";
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 text-xs px-2 py-0.5"
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded transition-colors",
        className
      )}
      title="Clique para editar"
    >
      {value || "-"}
    </span>
  );
}

// Asset badge component (read-only, shows asset name)
function AssetBadge({
  assetName,
  isCredit,
  affectsValue,
}: {
  assetName: string | null;
  isCredit: boolean;
  affectsValue: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0",
        !affectsValue
          ? "bg-muted text-muted-foreground border-muted-foreground/30"
          : isCredit
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      )}
    >
      {assetName || (isCredit ? "Entrada" : "Saída")}
      {!affectsValue && assetName && " 💰"}
    </Badge>
  );
}

export default function WealthTransactionsTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<WealthTransaction | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [coloredCells, setColoredCells] = useState<Record<string, ColorOption>>(() => {
    const saved = localStorage.getItem("wealth-transactions-colors");
    return saved ? JSON.parse(saved) : {};
  });

  // Persist colors to localStorage
  useEffect(() => {
    if (Object.keys(coloredCells).length > 0) {
      localStorage.setItem("wealth-transactions-colors", JSON.stringify(coloredCells));
    } else {
      localStorage.removeItem("wealth-transactions-colors");
    }
  }, [coloredCells]);

  const handleClearColors = () => {
    setColoredCells({});
  };

  const handleSetCellColor = (cellId: string, color: ColorOption) => {
    setColoredCells((prev) => {
      if (color === "none") {
        const { [cellId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cellId]: color };
    });
  };

  const getCellStyle = (cellId: string) => {
    const color = coloredCells[cellId];
    if (!color) return { bg: "", text: "" };
    const option = COLOR_OPTIONS.find((c) => c.value === color);
    return option ? { bg: option.bg, text: option.text } : { bg: "", text: "" };
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["wealth-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("*, wealth_assets(name)")
        .order("date", { ascending: false });

      if (error) throw error;
      return (data || []) as WealthTransaction[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: string;
      value: string | number;
    }) => {
      const { error } = await supabase
        .from("wealth_transactions")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-transactions"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wealth_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-transactions"] });
      toast.success("Transação eliminada");
    },
    onError: () => {
      toast.error("Erro ao eliminar transação");
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const handleInlineEdit = (id: string, field: string, value: string) => {
    if (field === "amount") {
      // Parse Portuguese number format
      const numValue = parseFloat(value.replace(/\s/g, "").replace(",", "."));
      if (!isNaN(numValue)) {
        updateMutation.mutate({ id, field, value: numValue });
      }
    } else {
      updateMutation.mutate({ id, field, value });
    }
  };

  const handleEdit = (transaction: WealthTransaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  // Calculate running balance (sorted by date ascending, then by created_at for stability)
  const transactionsWithBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      // Secondary sort by created_at for stable ordering
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let runningBalance = 0;
    const withBalance = sorted.map((t) => {
      runningBalance += t.amount;
      return { ...t, running_balance: runningBalance };
    });

    return withBalance;
  }, [transactions]);

  // Apply user sorting with stable secondary sort
  const sortedTransactions = useMemo(() => {
    return [...transactionsWithBalance].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          // Secondary sort by created_at when dates are equal
          if (comparison === 0) {
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "counterparty":
          const nameA = (a.counterparty || a.description || "").toLowerCase();
          const nameB = (b.counterparty || b.description || "").toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "category":
          const catA = (a.category || "").toLowerCase();
          const catB = (b.category || "").toLowerCase();
          comparison = catA.localeCompare(catB);
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [transactionsWithBalance, sortField, sortDirection]);
  // Calculate totals
  const totalCredits = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = transactionsWithBalance[transactionsWithBalance.length - 1]?.running_balance || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        A carregar transações...
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-muted-foreground">Créditos:</span>{" "}
            <span className="font-semibold text-green-600">{formatCurrency(totalCredits)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Débitos:</span>{" "}
            <span className="font-semibold text-red-500">{formatCurrency(totalDebits)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Saldo:</span>{" "}
            <span className={cn("font-semibold", currentBalance >= 0 ? "text-green-600" : "text-red-500")}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" />
          Nova Transação
        </Button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="text-xs">
              <TableHead className="w-[38%] text-left py-2">
                <button
                  onClick={() => handleSort("counterparty")}
                  className="flex items-center text-xs font-semibold hover:text-foreground transition-colors"
                >
                  Crédito
                  {getSortIcon("counterparty")}
                </button>
              </TableHead>
              <TableHead className="w-[12%] text-center py-2">
                <button
                  onClick={() => handleSort("date")}
                  className="flex items-center justify-center text-xs font-semibold hover:text-foreground transition-colors w-full"
                >
                  Data
                  {getSortIcon("date")}
                </button>
              </TableHead>
              <TableHead className="w-[38%] text-right py-2">
                <button
                  onClick={() => handleSort("amount")}
                  className="flex items-center justify-end text-xs font-semibold hover:text-foreground transition-colors w-full"
                >
                  Débito
                  {getSortIcon("amount")}
                </button>
              </TableHead>
              <TableHead className="w-[12%] text-right py-2 text-xs font-semibold">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Sem transações registadas.
                </TableCell>
              </TableRow>
            ) : (
              sortedTransactions.map((transaction) => {
                const isCredit = transaction.amount > 0;
                const displayName = transaction.counterparty || transaction.description || "";

                return (
                  <TableRow key={transaction.id} className="group hover:bg-muted/30 text-xs">
                    {/* Crédito Column */}
                    <TableCell className="text-left py-1.5">
                    {isCredit ? (
                        <div className="flex items-center gap-2">
                          <AssetBadge
                            assetName={transaction.wealth_assets?.name || null}
                            isCredit={true}
                            affectsValue={transaction.affects_asset_value !== false}
                          />
                          <EditableCell
                            value={displayName}
                            onSave={(val) => handleInlineEdit(transaction.id, "counterparty", val)}
                            className="font-medium text-xs truncate flex-1"
                          />
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <span className={cn(
                                "cursor-context-menu px-1 py-0.5 rounded",
                                getCellStyle(transaction.id).bg || ""
                              )}>
                                <EditableCell
                                  value={transaction.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                  onSave={(val) => handleInlineEdit(transaction.id, "amount", val)}
                                  type="text"
                                  className={cn(
                                    "font-semibold text-xs whitespace-nowrap",
                                    getCellStyle(transaction.id).text || "text-green-600"
                                  )}
                                />
                                <span className="text-muted-foreground text-xs ml-1">€</span>
                              </span>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="bg-background border shadow-lg z-50">
                              {COLOR_OPTIONS.map((opt) => (
                                <ContextMenuItem key={opt.value} onClick={() => handleSetCellColor(transaction.id, opt.value)} className={opt.text}>
                                  <Circle className={`h-3 w-3 mr-2 ${opt.value !== "none" ? opt.bg : ""}`} fill={opt.value !== "none" ? "currentColor" : "none"} />
                                  {opt.label}
                                </ContextMenuItem>
                              ))}
                            </ContextMenuContent>
                          </ContextMenu>
                          {/* Action buttons on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(transaction.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </TableCell>

                    {/* Data Column */}
                    <TableCell className="text-center text-xs text-muted-foreground py-1.5">
                      {format(new Date(transaction.date), "dd/MM/yyyy", { locale: pt })}
                    </TableCell>

                    {/* Débito Column */}
                    <TableCell className="text-right py-1.5">
                      {!isCredit ? (
                        <div className="flex items-center gap-2 justify-end">
                          {/* Action buttons on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mr-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(transaction.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <span className={cn(
                                "cursor-context-menu px-1 py-0.5 rounded",
                                getCellStyle(transaction.id).bg || ""
                              )}>
                                <EditableCell
                                  value={Math.abs(transaction.amount).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                                  onSave={(val) => {
                                    const numVal = parseFloat(val.replace(/\s/g, "").replace(",", "."));
                                    if (!isNaN(numVal)) {
                                      handleInlineEdit(transaction.id, "amount", (-Math.abs(numVal)).toString());
                                    }
                                  }}
                                  type="text"
                                  className={cn(
                                    "font-semibold text-xs whitespace-nowrap",
                                    getCellStyle(transaction.id).text || "text-red-500"
                                  )}
                                />
                                <span className="text-muted-foreground text-xs ml-1">€</span>
                              </span>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="bg-background border shadow-lg z-50">
                              {COLOR_OPTIONS.map((opt) => (
                                <ContextMenuItem key={opt.value} onClick={() => handleSetCellColor(transaction.id, opt.value)} className={opt.text}>
                                  <Circle className={`h-3 w-3 mr-2 ${opt.value !== "none" ? opt.bg : ""}`} fill={opt.value !== "none" ? "currentColor" : "none"} />
                                  {opt.label}
                                </ContextMenuItem>
                              ))}
                            </ContextMenuContent>
                          </ContextMenu>
                          <EditableCell
                            value={displayName}
                            onSave={(val) => handleInlineEdit(transaction.id, "counterparty", val)}
                            className="font-medium text-xs truncate flex-1 text-right"
                          />
                          <AssetBadge
                            assetName={transaction.wealth_assets?.name || null}
                            isCredit={false}
                            affectsValue={transaction.affects_asset_value !== false}
                          />
                        </div>
                      ) : null}
                    </TableCell>

                    {/* Saldo Column */}
                    <TableCell className="text-right py-1.5">
                      <span className={cn("font-semibold text-xs", transaction.running_balance >= 0 ? "text-green-600" : "text-red-500")}>
                        {formatCurrency(transaction.running_balance)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter className="bg-muted/30 text-xs">
            <TableRow>
              <TableCell className="text-left font-semibold text-green-600 py-1.5">
                Total: {formatCurrency(totalCredits)}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground py-1.5">
                {transactions.length} mov.
              </TableCell>
              <TableCell className="text-right font-semibold text-red-500 py-1.5">
                Total: {formatCurrency(totalDebits)}
              </TableCell>
              <TableCell className="text-right py-1.5">
                <span className={cn("font-bold", currentBalance >= 0 ? "text-green-600" : "text-red-500")}>
                  {formatCurrency(currentBalance)}
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Observações - Totais por cor (crédito soma, débito subtrai) */}
      {Object.keys(coloredCells).length > 0 && (() => {
        // Calcular totais por cor
        const colorTotals: Record<ColorOption, number> = {
          none: 0, green: 0, blue: 0, amber: 0, red: 0, purple: 0
        };
        
        Object.entries(coloredCells).forEach(([cellId, color]) => {
          const tx = transactions.find((t) => t.id === cellId);
          if (tx && color !== "none") {
            // Crédito soma, Débito subtrai
            if (tx.transaction_type === "credit") {
              colorTotals[color] += Math.abs(tx.amount);
            } else {
              colorTotals[color] -= Math.abs(tx.amount);
            }
          }
        });
        
        // Filtrar cores com valores
        const activeColors = COLOR_OPTIONS.filter(
          (opt) => opt.value !== "none" && colorTotals[opt.value] !== 0
        );
        
        // Total geral
        const grandTotal = Object.values(colorTotals).reduce((sum, val) => sum + val, 0);
        
        return (
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="text-xs font-medium text-muted-foreground mb-2">Observações</div>
            <div className="flex items-center gap-4 flex-wrap">
              {activeColors.map((opt) => (
                <div key={opt.value} className={`flex items-center gap-2 px-2 py-1 rounded ${opt.bg}`}>
                  <span className={`text-xs ${opt.text}`}>{opt.label}:</span>
                  <span className={`text-sm font-semibold ${opt.text}`}>
                    {formatCurrency(colorTotals[opt.value])}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10">
                  <span className="text-xs font-medium">Total:</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearColors}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      <WealthTransactionDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        transaction={editingTransaction}
      />
    </div>
  );
}