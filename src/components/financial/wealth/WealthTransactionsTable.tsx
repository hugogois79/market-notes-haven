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
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cashflow Ledger</h3>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>
              Créditos: <span className="text-green-500 font-medium">{formatCurrency(totalCredits)}</span>
            </span>
            <span>
              Débitos: <span className="text-red-500 font-medium">{formatCurrency(totalDebits)}</span>
            </span>
            <span>
              Saldo: <span className={cn("font-medium", currentBalance >= 0 ? "text-green-500" : "text-red-500")}>
                {formatCurrency(currentBalance)}
              </span>
            </span>
          </div>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead>Contraparte</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação registada
                </TableCell>
              </TableRow>
            ) : (
              transactionsWithBalance.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {format(new Date(transaction.date), "dd/MM/yyyy", { locale: pt })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.counterparty || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.amount >= 0 ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                      )}
                      {transaction.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.category && (
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    transaction.amount >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    transaction.running_balance >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(transaction.running_balance)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteMutation.mutate(transaction.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
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
