import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface ProjectCashflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Expense {
  id: string;
  amount: number;
  expense_date: string;
  description: string;
  supplier: string;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function ProjectCashflowDialog({
  open,
  onOpenChange,
  project,
}: ProjectCashflowDialogProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["project-expenses", project?.id, selectedYear],
    queryFn: async () => {
      if (!project?.id) return [];
      
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("project_id", project.id)
        .gte("expense_date", startDate)
        .lte("expense_date", endDate)
        .order("expense_date");
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!project?.id && open,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Group expenses by supplier
  const expensesBySupplier = expenses?.reduce((acc, expense) => {
    if (!acc[expense.supplier]) {
      acc[expense.supplier] = [];
    }
    acc[expense.supplier].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>) || {};

  // Calculate monthly totals for each supplier
  const getMonthlyAmount = (supplierExpenses: Expense[], monthIndex: number) => {
    return supplierExpenses
      .filter(exp => new Date(exp.expense_date).getMonth() === monthIndex)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Calculate supplier yearly total
  const getSupplierTotal = (supplierExpenses: Expense[]) => {
    return supplierExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Calculate monthly totals across all suppliers
  const getMonthTotal = (monthIndex: number) => {
    return expenses
      ?.filter(exp => new Date(exp.expense_date).getMonth() === monthIndex)
      .reduce((sum, exp) => sum + exp.amount, 0) || 0;
  };

  // Calculate running balance (cumulative)
  const getRunningBalance = (upToMonth: number) => {
    let total = 0;
    for (let i = 0; i <= upToMonth; i++) {
      total += getMonthTotal(i);
    }
    return total;
  };

  // Get year total
  const yearTotal = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span 
                className="px-3 py-1 rounded text-white"
                style={{ backgroundColor: project?.color }}
              >
                {project?.name}
              </span>
              <span className="text-muted-foreground font-normal">- Cashflow</span>
            </DialogTitle>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 bg-muted/50 min-w-[200px]">Descrição</TableHead>
                  {MONTHS.map(month => (
                    <TableHead key={month} className="text-right min-w-[90px]">{month}</TableHead>
                  ))}
                  <TableHead className="text-right min-w-[100px] font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      A carregar...
                    </TableCell>
                  </TableRow>
                ) : Object.keys(expensesBySupplier).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      Sem despesas registadas para {selectedYear}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Section Header: Pagamentos */}
                    <TableRow className="bg-destructive/10">
                      <TableCell colSpan={14} className="font-bold text-destructive">
                        Pagamentos
                      </TableCell>
                    </TableRow>

                    {/* Expense rows by supplier */}
                    {Object.entries(expensesBySupplier).map(([supplier, supplierExpenses]) => (
                      <TableRow key={supplier} className="hover:bg-muted/30">
                        <TableCell className="sticky left-0 bg-background font-medium">
                          {supplier}
                        </TableCell>
                        {MONTHS.map((_, monthIndex) => {
                          const amount = getMonthlyAmount(supplierExpenses, monthIndex);
                          return (
                            <TableCell key={monthIndex} className="text-right text-destructive">
                              {amount > 0 ? formatCurrency(-amount) : "-"}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(-getSupplierTotal(supplierExpenses))}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Total Pagamentos row */}
                    <TableRow className="bg-destructive/5 font-bold border-t-2">
                      <TableCell className="sticky left-0 bg-destructive/5">Total Pagamentos</TableCell>
                      {MONTHS.map((_, monthIndex) => {
                        const amount = getMonthTotal(monthIndex);
                        return (
                          <TableCell key={monthIndex} className="text-right text-destructive">
                            {amount > 0 ? formatCurrency(-amount) : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right text-destructive">
                        {formatCurrency(-yearTotal)}
                      </TableCell>
                    </TableRow>

                    {/* Saldo Acumulado row */}
                    <TableRow className="bg-muted font-bold border-t-2">
                      <TableCell className="sticky left-0 bg-muted">Saldo Acumulado</TableCell>
                      {MONTHS.map((_, monthIndex) => {
                        const balance = getRunningBalance(monthIndex);
                        return (
                          <TableCell key={monthIndex} className="text-right">
                            {balance > 0 ? formatCurrency(-balance) : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        {formatCurrency(-yearTotal)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
