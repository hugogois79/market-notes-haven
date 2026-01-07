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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import WealthTransactionDialog from "./WealthTransactionDialog";

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
}: {
  assetName: string | null;
  isCredit: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0",
        isCredit
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      )}
    >
      {assetName || (isCredit ? "Entrada" : "Saída")}
    </Badge>
  );
}

export default function WealthTransactionsTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<WealthTransaction | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["wealth-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("*, wealth_assets(name)")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as WealthTransaction[];
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

  // Calculate running balance (sorted by date ascending for calculation)
  const transactionsWithBalance = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = 0;
    const withBalance = sorted.map((t) => {
      runningBalance += t.amount;
      return { ...t, running_balance: runningBalance };
    });

    return withBalance;
  }, [transactions]);

  // Apply user sorting
  const sortedTransactions = useMemo(() => {
    return [...transactionsWithBalance].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
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
                          />
                          <EditableCell
                            value={displayName}
                            onSave={(val) => handleInlineEdit(transaction.id, "counterparty", val)}
                            className="font-medium text-xs truncate flex-1"
                          />
                          <EditableCell
                            value={transaction.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                            onSave={(val) => handleInlineEdit(transaction.id, "amount", val)}
                            type="text"
                            className="text-green-600 font-semibold text-xs whitespace-nowrap"
                          />
                          <span className="text-muted-foreground text-xs">€</span>
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
                          <EditableCell
                            value={Math.abs(transaction.amount).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                            onSave={(val) => {
                              const numVal = parseFloat(val.replace(/\s/g, "").replace(",", "."));
                              if (!isNaN(numVal)) {
                                handleInlineEdit(transaction.id, "amount", (-Math.abs(numVal)).toString());
                              }
                            }}
                            type="text"
                            className="text-red-500 font-semibold text-xs whitespace-nowrap"
                          />
                          <span className="text-muted-foreground text-xs">€</span>
                          <EditableCell
                            value={displayName}
                            onSave={(val) => handleInlineEdit(transaction.id, "counterparty", val)}
                            className="font-medium text-xs truncate flex-1 text-right"
                          />
                          <AssetBadge
                            assetName={transaction.wealth_assets?.name || null}
                            isCredit={false}
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

      <WealthTransactionDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        transaction={editingTransaction}
      />
    </div>
  );
}