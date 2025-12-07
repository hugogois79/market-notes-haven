import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";

interface BudgetingManagementProps {
  companyId: string;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function BudgetingManagement({ companyId }: BudgetingManagementProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingBudgets, setEditingBudgets] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["expense-projects-budgeting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: budgets } = useQuery({
    queryKey: ["project-budgets", selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_monthly_budgets")
        .select("*")
        .eq("year", selectedYear);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses-by-month", selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, expense_date, project_id")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ projectId, month, amount }: { projectId: string; month: number; amount: number }) => {
      const { error } = await supabase
        .from("project_monthly_budgets")
        .upsert({
          project_id: projectId,
          year: selectedYear,
          month,
          budgeted_amount: amount,
        }, {
          onConflict: 'project_id,year,month'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-budgets"] });
      toast.success("Orçamento guardado");
    },
    onError: () => {
      toast.error("Erro ao guardar orçamento");
    },
  });

  const getBudgetValue = (projectId: string, month: number) => {
    const key = `${projectId}-${month}`;
    if (editingBudgets[key] !== undefined) {
      return editingBudgets[key];
    }
    const budget = budgets?.find(b => b.project_id === projectId && b.month === month);
    return budget?.budgeted_amount ?? 0;
  };

  const getExpenseValue = (projectId: string, month: number) => {
    if (!expenses) return 0;
    return expenses
      .filter(e => {
        if (e.project_id !== projectId) return false;
        const expenseMonth = new Date(e.expense_date).getMonth() + 1;
        return expenseMonth === month;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const handleBudgetChange = (projectId: string, month: number, value: string) => {
    const key = `${projectId}-${month}`;
    const numValue = parseFloat(value) || 0;
    setEditingBudgets(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = (projectId: string, month: number) => {
    const key = `${projectId}-${month}`;
    const amount = editingBudgets[key] ?? getBudgetValue(projectId, month);
    saveMutation.mutate({ projectId, month, amount });
    setEditingBudgets(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getProjectTotals = (projectId: string) => {
    let totalBudget = 0;
    let totalExpense = 0;
    for (let m = 1; m <= 12; m++) {
      totalBudget += Number(getBudgetValue(projectId, m));
      totalExpense += getExpenseValue(projectId, m);
    }
    return { totalBudget, totalExpense, variance: totalBudget - totalExpense };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Orçamento por Projeto</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold w-16 text-center">{selectedYear}</span>
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-medium sticky left-0 bg-background min-w-[150px]">Projeto</th>
              {MONTHS.map((month, i) => (
                <th key={month} className="text-center p-2 font-medium min-w-[100px]">{month}</th>
              ))}
              <th className="text-center p-2 font-medium min-w-[100px]">Total Orç.</th>
              <th className="text-center p-2 font-medium min-w-[100px]">Total Real</th>
              <th className="text-center p-2 font-medium min-w-[100px]">Variação</th>
            </tr>
          </thead>
          <tbody>
            {projects?.map(project => {
              const totals = getProjectTotals(project.id);
              return (
                <tr key={project.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 sticky left-0 bg-background">
                    <span 
                      className="px-2 py-1 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: project.color || '#3878B5' }}
                    >
                      {project.name}
                    </span>
                  </td>
                  {MONTHS.map((_, monthIndex) => {
                    const month = monthIndex + 1;
                    const budgetValue = getBudgetValue(project.id, month);
                    const expenseValue = getExpenseValue(project.id, month);
                    const key = `${project.id}-${month}`;
                    const isEditing = editingBudgets[key] !== undefined;
                    
                    return (
                      <td key={month} className="p-1 text-center">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={budgetValue}
                              onChange={(e) => handleBudgetChange(project.id, month, e.target.value)}
                              className="h-7 text-xs text-center w-20"
                              placeholder="0"
                            />
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleSave(project.id, month)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {expenseValue > 0 && (
                            <span className={`text-xs ${expenseValue > budgetValue && budgetValue > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {formatCurrency(expenseValue)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-medium">
                    {formatCurrency(totals.totalBudget)}
                  </td>
                  <td className="p-2 text-center font-medium text-red-600">
                    {formatCurrency(totals.totalExpense)}
                  </td>
                  <td className={`p-2 text-center font-medium ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totals.variance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
