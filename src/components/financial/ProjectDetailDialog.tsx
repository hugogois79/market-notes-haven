import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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
import { Calendar, Euro, FileText, Receipt, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy");
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "0,00 €";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  if (!project) return null;

  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const expenseCount = expenses?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full border-2"
              style={{ backgroundColor: project.color }}
            />
            <span>{project.name}</span>
            <Badge variant={project.is_active ? "default" : "secondary"}>
              {project.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Data Início</span>
                </div>
                <p className="text-lg font-semibold mt-1">
                  {formatDate(project.start_date)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Data Fim</span>
                </div>
                <p className="text-lg font-semibold mt-1">
                  {formatDate(project.end_date)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Custo Total</span>
                </div>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(project.total_cost)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Despesas</span>
                </div>
                <p className="text-lg font-semibold mt-1">
                  {expenseCount} registos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Despesas do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : expenses?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma despesa registada para este projeto</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Recibo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses?.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.expense_date)}</TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell className="text-muted-foreground">{expense.supplier}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>
                            {expense.receipt_image_url ? (
                              <a
                                href={expense.receipt_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Ver
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {expenses && expenses.length > 0 && (
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground mr-4">Total Despesas:</span>
                    <span className="text-xl font-bold">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
