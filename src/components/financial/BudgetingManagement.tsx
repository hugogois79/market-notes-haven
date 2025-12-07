import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Save, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
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

  const { data: categories } = useQuery({
    queryKey: ["expense-categories-budgeting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
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
        .select("amount, expense_date, project_id, category_id")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ projectId, categoryId, month, amount }: { projectId: string; categoryId: string | null; month: number; amount: number }) => {
      const { error } = await supabase
        .from("project_monthly_budgets")
        .upsert({
          project_id: projectId,
          category_id: categoryId,
          year: selectedYear,
          month,
          budgeted_amount: amount,
        }, {
          onConflict: 'project_id,year,month,category_id'
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

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getProjectCategories = (projectId: string) => {
    if (!categories) return [];
    return categories.filter(cat => 
      cat.assigned_project_ids?.includes(projectId)
    );
  };

  const getBudgetValue = (projectId: string, categoryId: string | null, month: number) => {
    const key = `${projectId}-${categoryId || 'null'}-${month}`;
    if (editingBudgets[key] !== undefined) {
      return editingBudgets[key];
    }
    const budget = budgets?.find(b => 
      b.project_id === projectId && 
      b.category_id === categoryId && 
      b.month === month
    );
    return budget?.budgeted_amount ?? 0;
  };

  const getExpenseValue = (projectId: string, categoryId: string | null, month: number) => {
    if (!expenses) return 0;
    return expenses
      .filter(e => {
        if (e.project_id !== projectId) return false;
        if (categoryId !== null && e.category_id !== categoryId) return false;
        const expenseMonth = new Date(e.expense_date).getMonth() + 1;
        return expenseMonth === month;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getProjectExpenseValue = (projectId: string, month: number) => {
    if (!expenses) return 0;
    return expenses
      .filter(e => {
        if (e.project_id !== projectId) return false;
        const expenseMonth = new Date(e.expense_date).getMonth() + 1;
        return expenseMonth === month;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const handleBudgetChange = (projectId: string, categoryId: string | null, month: number, value: string) => {
    const key = `${projectId}-${categoryId || 'null'}-${month}`;
    const numValue = parseFloat(value) || 0;
    setEditingBudgets(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = (projectId: string, categoryId: string | null, month: number) => {
    const key = `${projectId}-${categoryId || 'null'}-${month}`;
    const amount = editingBudgets[key] ?? getBudgetValue(projectId, categoryId, month);
    saveMutation.mutate({ projectId, categoryId, month, amount });
    setEditingBudgets(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const getProjectTotals = (projectId: string) => {
    const projectCategories = getProjectCategories(projectId);
    let totalBudget = 0;
    let totalExpense = 0;

    if (projectCategories.length === 0) {
      // No categories - use project-level budgets
      for (let m = 1; m <= 12; m++) {
        totalBudget += Number(getBudgetValue(projectId, null, m));
        totalExpense += getProjectExpenseValue(projectId, m);
      }
    } else {
      // Sum category budgets
      for (const cat of projectCategories) {
        for (let m = 1; m <= 12; m++) {
          totalBudget += Number(getBudgetValue(projectId, cat.id, m));
        }
      }
      for (let m = 1; m <= 12; m++) {
        totalExpense += getProjectExpenseValue(projectId, m);
      }
    }
    
    return { totalBudget, totalExpense, variance: totalBudget - totalExpense };
  };

  const getCategoryTotals = (projectId: string, categoryId: string) => {
    let totalBudget = 0;
    let totalExpense = 0;
    for (let m = 1; m <= 12; m++) {
      totalBudget += Number(getBudgetValue(projectId, categoryId, m));
      totalExpense += getExpenseValue(projectId, categoryId, m);
    }
    return { totalBudget, totalExpense, variance: totalBudget - totalExpense };
  };

  const getProjectBudgetForMonth = (projectId: string, month: number) => {
    const projectCategories = getProjectCategories(projectId);
    if (projectCategories.length === 0) {
      return Number(getBudgetValue(projectId, null, month));
    }
    return projectCategories.reduce((sum, cat) => 
      sum + Number(getBudgetValue(projectId, cat.id, month)), 0
    );
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
              <th className="text-left p-2 font-medium sticky left-0 bg-background min-w-[180px]">Projeto</th>
              {MONTHS.map((month) => (
                <th key={month} className="text-center p-2 font-medium min-w-[80px]">{month}</th>
              ))}
              <th className="text-center p-2 font-medium min-w-[90px]">Total Orç.</th>
              <th className="text-center p-2 font-medium min-w-[90px]">Total Real</th>
              <th className="text-center p-2 font-medium min-w-[90px]">Variação</th>
            </tr>
          </thead>
          <tbody>
            {projects?.map(project => {
              const totals = getProjectTotals(project.id);
              const isExpanded = expandedProjects.has(project.id);
              const projectCategories = getProjectCategories(project.id);
              const hasCategories = projectCategories.length > 0;

              return (
                <>
                  {/* Project Row */}
                  <tr key={project.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 sticky left-0 bg-background">
                      <div className="flex items-center gap-2">
                        {hasCategories && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleProject(project.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        )}
                        <span 
                          className="px-2 py-1 rounded text-white text-xs font-medium cursor-pointer"
                          style={{ backgroundColor: project.color || '#3878B5' }}
                          onClick={() => hasCategories && toggleProject(project.id)}
                        >
                          {project.name}
                        </span>
                      </div>
                    </td>
                    {MONTHS.map((_, monthIndex) => {
                      const month = monthIndex + 1;
                      const budgetValue = getProjectBudgetForMonth(project.id, month);
                      const expenseValue = getProjectExpenseValue(project.id, month);
                      
                      return (
                        <td key={month} className="p-1 text-center">
                          {hasCategories ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium">
                                {budgetValue > 0 ? formatCurrency(budgetValue) : '-'}
                              </span>
                              {expenseValue > 0 && (
                                <span className={`text-xs ${expenseValue > budgetValue && budgetValue > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                  {formatCurrency(expenseValue)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 justify-center">
                                <Input
                                  type="number"
                                  value={getBudgetValue(project.id, null, month)}
                                  onChange={(e) => handleBudgetChange(project.id, null, month, e.target.value)}
                                  className="h-7 text-xs text-center w-16"
                                  placeholder="0"
                                />
                                {editingBudgets[`${project.id}-null-${month}`] !== undefined && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleSave(project.id, null, month)}
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
                          )}
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

                  {/* Category Rows (when expanded) */}
                  {isExpanded && projectCategories.map(category => {
                    const catTotals = getCategoryTotals(project.id, category.id);
                    
                    return (
                      <tr key={`${project.id}-${category.id}`} className="border-b bg-muted/30 hover:bg-muted/50">
                        <td className="p-2 pl-10 sticky left-0 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color || '#888' }}
                            />
                            <span className="text-sm">{category.name}</span>
                          </div>
                        </td>
                        {MONTHS.map((_, monthIndex) => {
                          const month = monthIndex + 1;
                          const budgetValue = getBudgetValue(project.id, category.id, month);
                          const expenseValue = getExpenseValue(project.id, category.id, month);
                          const key = `${project.id}-${category.id}-${month}`;
                          const isEditing = editingBudgets[key] !== undefined;
                          
                          return (
                            <td key={month} className="p-1 text-center">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 justify-center">
                                  <Input
                                    type="number"
                                    value={budgetValue}
                                    onChange={(e) => handleBudgetChange(project.id, category.id, month, e.target.value)}
                                    className="h-6 text-xs text-center w-14"
                                    placeholder="0"
                                  />
                                  {isEditing && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleSave(project.id, category.id, month)}
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
                        <td className="p-2 text-center text-sm">
                          {formatCurrency(catTotals.totalBudget)}
                        </td>
                        <td className="p-2 text-center text-sm text-red-600">
                          {formatCurrency(catTotals.totalExpense)}
                        </td>
                        <td className={`p-2 text-center text-sm ${catTotals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(catTotals.variance)}
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
