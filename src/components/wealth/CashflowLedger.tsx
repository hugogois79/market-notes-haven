import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { WealthTransaction, wealthService, formatEUR } from "@/services/wealthService";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface CashflowLedgerProps {
  transactions: WealthTransaction[];
  onRefresh: () => void;
}

const CATEGORIES = [
  'Income',
  'Rent',
  'Investment Return',
  'Sale',
  'Expense',
  'Tax',
  'Maintenance',
  'Insurance',
  'Legal',
  'Purchase',
  'Transfer',
  'Other',
];

const CashflowLedger = ({ transactions, onRefresh }: CashflowLedgerProps) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    category: '',
    amount: '',
    transaction_type: 'credit' as 'credit' | 'debit',
  });

  // Sort transactions by date (newest first) and calculate running balance
  const transactionsWithBalance = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let runningBalance = 0;
    return sorted.map(t => {
      if (t.transaction_type === 'credit') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      return { ...t, balance: runningBalance };
    }).reverse();
  }, [transactions]);

  const currentBalance = transactionsWithBalance.length > 0 
    ? transactionsWithBalance[0].balance 
    : 0;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      return wealthService.createTransaction({
        user_id: user?.id || null,
        date: data.date,
        description: data.description,
        category: data.category || null,
        amount: parseFloat(data.amount),
        transaction_type: data.transaction_type,
        asset_id: null,
        notes: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-transactions'] });
      toast.success("Transaction added");
      setShowForm(false);
      resetForm();
      onRefresh();
    },
    onError: () => toast.error("Failed to add transaction"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wealthService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-transactions'] });
      toast.success("Transaction deleted");
      onRefresh();
    },
    onError: () => toast.error("Failed to delete transaction"),
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      category: '',
      amount: '',
      transaction_type: 'credit',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Cashflow Ledger
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Current Balance: <span className={cn(
                "font-mono font-semibold",
                currentBalance >= 0 ? "text-emerald-600" : "text-red-600"
              )}>{formatEUR(currentBalance)}</span>
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Transaction
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Quick Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-6 gap-3 items-end">
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Transaction description"
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount (EUR) *</Label>
                <div className="flex gap-1">
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value: 'credit' | 'debit') => 
                      setFormData({ ...formData, transaction_type: value })
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">
                        <span className="text-emerald-600">+</span>
                      </SelectItem>
                      <SelectItem value="debit">
                        <span className="text-red-600">−</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  Add
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Transactions Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32">Category</TableHead>
              <TableHead className="w-32 text-right">Debit</TableHead>
              <TableHead className="w-32 text-right">Credit</TableHead>
              <TableHead className="w-36 text-right">Balance</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                  No transactions yet. Add your first transaction above.
                </TableCell>
              </TableRow>
            ) : (
              transactionsWithBalance.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm text-slate-600">
                    {format(new Date(transaction.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {transaction.transaction_type === 'credit' ? (
                        <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                      {transaction.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {transaction.category || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-600">
                    {transaction.transaction_type === 'debit' ? formatEUR(transaction.amount) : ''}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-600">
                    {transaction.transaction_type === 'credit' ? formatEUR(transaction.amount) : ''}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-sm font-medium",
                    transaction.balance >= 0 ? "text-slate-900" : "text-red-600"
                  )}>
                    {formatEUR(transaction.balance)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                      onClick={() => {
                        if (confirm('Delete this transaction?')) {
                          deleteMutation.mutate(transaction.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CashflowLedger;
