import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar, Euro, FileText, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExpenseProject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  total_cost: number | null;
  created_at: string;
  updated_at: string;
}

interface ProjectDetailDialogProps {
  project: ExpenseProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Expense {
  id: string;
  description: string;
  supplier: string;
  amount: number;
  expense_date: string;
  receipt_image_url: string | null;
}

interface FinancialTransaction {
  id: string;
  description: string;
  entity_name: string;
  total_amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
}

interface MonthlyData {
  month: string;
  year: number;
  monthNum: number;
  receipts: Array<{ description: string; entity: string; amount: number; date: string }>;
  payments: Array<{ description: string; entity: string; amount: number; date: string }>;
  totalReceipts: number;
  totalPayments: number;
  balance: number;
}

export default function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
}: ProjectDetailDialogProps) {
  // Fetch expenses for this project
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["project-expenses", project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("project_id", project.id)
        .order("expense_date", { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!project?.id && open,
  });

  // Fetch financial transactions for this project
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["project-transactions", project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("project_id", project.id)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!project?.id && open,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy");
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "0,00 €";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Organize data by month/year in cashflow format
  const cashflowData = useMemo(() => {
    const monthlyMap = new Map<string, MonthlyData>();
    
    // Process financial transactions
    transactions?.forEach((tx) => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = format(date, "MMMM", { locale: pt });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1,
          receipts: [],
          payments: [],
          totalReceipts: 0,
          totalPayments: 0,
          balance: 0,
        });
      }
      
      const monthData = monthlyMap.get(monthKey)!;
      
      if (tx.type === 'income') {
        monthData.receipts.push({
          description: tx.description,
          entity: tx.entity_name,
          amount: tx.total_amount,
          date: tx.date,
        });
        monthData.totalReceipts += tx.total_amount;
      } else {
        monthData.payments.push({
          description: tx.description,
          entity: tx.entity_name,
          amount: tx.total_amount,
          date: tx.date,
        });
        monthData.totalPayments += tx.total_amount;
      }
    });

    // Process expenses (as payments)
    expenses?.forEach((exp) => {
      const date = new Date(exp.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = format(date, "MMMM", { locale: pt });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1,
          receipts: [],
          payments: [],
          totalReceipts: 0,
          totalPayments: 0,
          balance: 0,
        });
      }
      
      const monthData = monthlyMap.get(monthKey)!;
      monthData.payments.push({
        description: exp.description,
        entity: exp.supplier,
        amount: exp.amount,
        date: exp.expense_date,
      });
      monthData.totalPayments += exp.amount;
    });

    // Calculate balances
    monthlyMap.forEach((data) => {
      data.balance = data.totalReceipts - data.totalPayments;
    });

    // Sort by year and month descending
    return Array.from(monthlyMap.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.monthNum - a.monthNum;
    });
  }, [expenses, transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalReceipts = 0;
    let totalPayments = 0;
    
    cashflowData.forEach((month) => {
      totalReceipts += month.totalReceipts;
      totalPayments += month.totalPayments;
    });
    
    return {
      receipts: totalReceipts,
      payments: totalPayments,
      balance: totalReceipts - totalPayments,
    };
  }, [cashflowData]);

  if (!project) return null;

  const isLoading = isLoadingExpenses || isLoadingTransactions;
  const hasData = cashflowData.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full border-2"
              style={{ backgroundColor: project.color }}
            />
            <span className="text-xl">{project.name}</span>
            <Badge variant={project.is_active ? "default" : "secondary"}>
              {project.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Project Info */}
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Data Início</span>
                </div>
                <p className="text-sm font-semibold mt-1">
                  {formatDate(project.start_date)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Data Fim</span>
                </div>
                <p className="text-sm font-semibold mt-1">
                  {formatDate(project.end_date)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 dark:text-green-400">Recebimentos</span>
                </div>
                <p className="text-sm font-bold mt-1 text-green-700 dark:text-green-400">
                  {formatCurrency(totals.receipts)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-700 dark:text-red-400">Pagamentos</span>
                </div>
                <p className="text-sm font-bold mt-1 text-red-700 dark:text-red-400">
                  {formatCurrency(totals.payments)}
                </p>
              </CardContent>
            </Card>
            <Card className={totals.balance >= 0 ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs">Saldo</span>
                </div>
                <p className={`text-sm font-bold mt-1 ${totals.balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                  {formatCurrency(totals.balance)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cashflow Table */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mapa de Cashflow do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !hasData ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum movimento registado para este projeto</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-6">
                    {cashflowData.map((monthData) => (
                      <div key={`${monthData.year}-${monthData.monthNum}`} className="border rounded-lg overflow-hidden">
                        {/* Month Header */}
                        <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                          <span className="font-semibold text-lg">
                            {monthData.month} {monthData.year}
                          </span>
                          <Badge variant={monthData.balance >= 0 ? "default" : "destructive"}>
                            Saldo: {formatCurrency(monthData.balance)}
                          </Badge>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Data</TableHead>
                              <TableHead className="w-[100px]">Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Entidade</TableHead>
                              <TableHead className="text-right w-[150px]">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Receipts Section */}
                            {monthData.receipts.length > 0 && (
                              <>
                                <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                                  <TableCell colSpan={5} className="py-1">
                                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3" />
                                      RECEBIMENTOS
                                    </span>
                                  </TableCell>
                                </TableRow>
                                {monthData.receipts.map((receipt, idx) => (
                                  <TableRow key={`receipt-${idx}`} className="hover:bg-green-50/30 dark:hover:bg-green-950/10">
                                    <TableCell className="text-sm">{formatDate(receipt.date)}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/50">
                                        Entrada
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{receipt.description}</TableCell>
                                    <TableCell className="text-muted-foreground">{receipt.entity}</TableCell>
                                    <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">
                                      +{formatCurrency(receipt.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-green-100/50 dark:bg-green-950/30 border-t">
                                  <TableCell colSpan={4} className="text-right text-sm font-medium text-green-700 dark:text-green-400">
                                    Subtotal Recebimentos:
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-green-700 dark:text-green-400">
                                    {formatCurrency(monthData.totalReceipts)}
                                  </TableCell>
                                </TableRow>
                              </>
                            )}

                            {/* Payments Section */}
                            {monthData.payments.length > 0 && (
                              <>
                                <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                                  <TableCell colSpan={5} className="py-1">
                                    <span className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                                      <TrendingDown className="h-3 w-3" />
                                      PAGAMENTOS
                                    </span>
                                  </TableCell>
                                </TableRow>
                                {monthData.payments.map((payment, idx) => (
                                  <TableRow key={`payment-${idx}`} className="hover:bg-red-50/30 dark:hover:bg-red-950/10">
                                    <TableCell className="text-sm">{formatDate(payment.date)}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 dark:bg-red-950/50">
                                        Saída
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{payment.description}</TableCell>
                                    <TableCell className="text-muted-foreground">{payment.entity}</TableCell>
                                    <TableCell className="text-right font-semibold text-red-700 dark:text-red-400">
                                      -{formatCurrency(payment.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-red-100/50 dark:bg-red-950/30 border-t">
                                  <TableCell colSpan={4} className="text-right text-sm font-medium text-red-700 dark:text-red-400">
                                    Subtotal Pagamentos:
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-red-700 dark:text-red-400">
                                    {formatCurrency(monthData.totalPayments)}
                                  </TableCell>
                                </TableRow>
                              </>
                            )}

                            {/* Monthly Balance */}
                            <TableRow className="bg-muted/70 border-t-2">
                              <TableCell colSpan={4} className="text-right font-semibold">
                                SALDO DO MÊS:
                              </TableCell>
                              <TableCell className={`text-right font-bold text-lg ${monthData.balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                {formatCurrency(monthData.balance)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ))}

                    {/* Grand Total */}
                    <div className="border-2 rounded-lg p-4 bg-muted/30">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Recebimentos</p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-400">
                            {formatCurrency(totals.receipts)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Pagamentos</p>
                          <p className="text-xl font-bold text-red-700 dark:text-red-400">
                            {formatCurrency(totals.payments)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Saldo Final</p>
                          <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                            {formatCurrency(totals.balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
