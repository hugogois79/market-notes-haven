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
import { ChevronDown, ChevronRight } from "lucide-react";

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
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
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
  const [expandedPayments, setExpandedPayments] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  const { data: categories } = useQuery({
    queryKey: ["expense_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name, color")
        .order("name");
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: open,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Group expenses by category, then by supplier
  const expensesByCategory = expenses?.reduce((acc, expense) => {
    const categoryId = expense.category_id || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = {};
    }
    if (!acc[categoryId][expense.supplier]) {
      acc[categoryId][expense.supplier] = [];
    }
    acc[categoryId][expense.supplier].push(expense);
    return acc;
  }, {} as Record<string, Record<string, Expense[]>>) || {};

  const getCategoryName = (categoryId: string) => {
    if (categoryId === "uncategorized") return "Sem Categoria";
    return categories?.find(c => c.id === categoryId)?.name || "Sem Categoria";
  };

  // Calculate monthly totals for expenses
  const getMonthlyAmount = (expenseList: Expense[], monthIndex: number) => {
    return expenseList
      .filter(exp => new Date(exp.expense_date).getMonth() === monthIndex)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Calculate supplier yearly total
  const getExpensesTotal = (expenseList: Expense[]) => {
    return expenseList.reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Calculate category monthly totals
  const getCategoryMonthlyTotal = (categoryId: string, monthIndex: number) => {
    const categoryExpenses = expensesByCategory[categoryId];
    if (!categoryExpenses) return 0;
    return Object.values(categoryExpenses).flat()
      .filter(exp => new Date(exp.expense_date).getMonth() === monthIndex)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Calculate category yearly total
  const getCategoryTotal = (categoryId: string) => {
    const categoryExpenses = expensesByCategory[categoryId];
    if (!categoryExpenses) return 0;
    return Object.values(categoryExpenses).flat()
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Calculate monthly totals across all expenses
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

  const togglePayments = () => setExpandedPayments(!expandedPayments);
  
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const hasExpenses = Object.keys(expensesByCategory).length > 0;

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
                ) : !hasExpenses ? (
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

                    {/* Total Pagamentos row - clickable to expand */}
                    <TableRow 
                      className="bg-destructive/5 font-bold border-t cursor-pointer hover:bg-destructive/10 transition-colors"
                      onClick={togglePayments}
                    >
                      <TableCell className="sticky left-0 bg-destructive/5 flex items-center gap-2">
                        {expandedPayments ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Total Pagamentos
                      </TableCell>
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

                    {/* Expanded: Categories */}
                    {expandedPayments && Object.keys(expensesByCategory).map((categoryId) => (
                      <>
                        {/* Category row - clickable to expand suppliers */}
                        <TableRow 
                          key={categoryId}
                          className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleCategory(categoryId)}
                        >
                          <TableCell className="sticky left-0 bg-muted/30 pl-8 flex items-center gap-2 font-medium">
                            {expandedCategories.has(categoryId) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {getCategoryName(categoryId)}
                          </TableCell>
                          {MONTHS.map((_, monthIndex) => {
                            const amount = getCategoryMonthlyTotal(categoryId, monthIndex);
                            return (
                              <TableCell key={monthIndex} className="text-right text-destructive">
                                {amount > 0 ? formatCurrency(-amount) : "-"}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right font-medium text-destructive">
                            {formatCurrency(-getCategoryTotal(categoryId))}
                          </TableCell>
                        </TableRow>

                        {/* Expanded: Suppliers within category */}
                        {expandedCategories.has(categoryId) && Object.entries(expensesByCategory[categoryId]).map(([supplier, supplierExpenses]) => (
                          <TableRow key={`${categoryId}-${supplier}`} className="hover:bg-muted/20">
                            <TableCell className="sticky left-0 bg-background pl-14 text-muted-foreground">
                              {supplier}
                            </TableCell>
                            {MONTHS.map((_, monthIndex) => {
                              const amount = getMonthlyAmount(supplierExpenses, monthIndex);
                              return (
                                <TableCell key={monthIndex} className="text-right text-destructive/80">
                                  {amount > 0 ? formatCurrency(-amount) : "-"}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-right text-destructive/80">
                              {formatCurrency(-getExpensesTotal(supplierExpenses))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}

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
