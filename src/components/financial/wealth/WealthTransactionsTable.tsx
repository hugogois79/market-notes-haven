import { useState, useMemo } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
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
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
};

export default function WealthTransactionsTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<WealthTransaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["wealth-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as WealthTransaction[];
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
    
    // Return in reverse order (newest first) for display
    return withBalance.reverse();
  }, [transactions]);

  // Calculate totals
  const totalCredits = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebits = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentBalance = transactionsWithBalance[0]?.running_balance || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        A carregar transações...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-muted-foreground">Créditos:</span>{" "}
            <span className="font-semibold text-green-600">{formatCurrency(totalCredits)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Débitos:</span>{" "}
            <span className="font-semibold text-red-500">{formatCurrency(totalDebits)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Saldo:</span>{" "}
            <span className={cn("font-semibold", currentBalance >= 0 ? "text-green-600" : "text-red-500")}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Transação
        </Button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[38%] text-left font-semibold">Crédito</TableHead>
              <TableHead className="w-[12%] text-center font-semibold">Data</TableHead>
              <TableHead className="w-[38%] text-right font-semibold">Débito</TableHead>
              <TableHead className="w-[12%] text-right font-semibold">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Sem transações registadas.
                </TableCell>
              </TableRow>
            ) : (
              transactionsWithBalance.map((transaction) => {
                const isCredit = transaction.amount > 0;
                const displayName = transaction.counterparty || transaction.description || "Sem descrição";

                return (
                  <TableRow key={transaction.id} className="group hover:bg-muted/30">
                    {/* Crédito Column */}
                    <TableCell className="text-left py-2">
                      {isCredit ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="bg-green-50 text-green-700 border-green-200 text-xs shrink-0"
                          >
                            {transaction.category || "Entrada"}
                          </Badge>
                          <span className="font-medium text-sm truncate flex-1">
                            {displayName}
                          </span>
                          <span className="text-green-600 font-semibold text-sm whitespace-nowrap">
                            {formatCurrency(transaction.amount)}
                          </span>
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
                    <TableCell className="text-center text-sm text-muted-foreground py-2">
                      {format(new Date(transaction.date), "dd/MM/yyyy", { locale: pt })}
                    </TableCell>

                    {/* Débito Column */}
                    <TableCell className="text-right py-2">
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
                          <span className="text-red-500 font-semibold text-sm whitespace-nowrap">
                            {formatCurrency(transaction.amount)}
                          </span>
                          <span className="font-medium text-sm truncate flex-1 text-right">
                            {displayName}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="bg-red-50 text-red-700 border-red-200 text-xs shrink-0"
                          >
                            {transaction.category || "Saída"}
                          </Badge>
                        </div>
                      ) : null}
                    </TableCell>

                    {/* Saldo Column */}
                    <TableCell className="text-right py-2">
                      <span className={cn("font-semibold text-sm", transaction.running_balance >= 0 ? "text-green-600" : "text-red-500")}>
                        {formatCurrency(transaction.running_balance)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter className="bg-muted/30">
            <TableRow>
              <TableCell className="text-left font-semibold text-green-600">
                Total: {formatCurrency(totalCredits)}
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">
                {transactions.length} mov.
              </TableCell>
              <TableCell className="text-right font-semibold text-red-500">
                Total: {formatCurrency(totalDebits)}
              </TableCell>
              <TableCell className="text-right">
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
