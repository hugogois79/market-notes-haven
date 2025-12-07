import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Save, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [editingRevenues, setEditingRevenues] = useState<Record<string, number>>({});
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedRevenueProjects, setExpandedRevenueProjects] = useState<Set<string>>(new Set());
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

  const { data: revenues } = useQuery({
    queryKey: ["project-revenues", selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_monthly_revenues")
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

  const saveRevenueMutation = useMutation({
    mutationFn: async ({ projectId, categoryId, month, amount }: { projectId: string; categoryId: string | null; month: number; amount: number }) => {
      const { error } = await supabase
        .from("project_monthly_revenues")
        .upsert({
          project_id: projectId,
          category_id: categoryId,
          year: selectedYear,
          month,
          budgeted_amount: amount,
        }, {
          onConflict: 'project_id,category_id,year,month'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-revenues"] });
      toast.success("Receita guardada");
    },
    onError: () => {
      toast.error("Erro ao guardar receita");
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

  const getProjectCategories = (projectId: string, forRevenue = false) => {
    if (!categories) return [];
    return categories.filter(cat => {
      if (!cat.assigned_project_ids?.includes(projectId)) return false;
      if (forRevenue) {
        return cat.category_type === 'revenue' || cat.category_type === 'both';
      }
      return cat.category_type === 'expense' || cat.category_type === 'both';
    });
  };

  const toggleRevenueProject = (projectId: string) => {
    setExpandedRevenueProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
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

  const getRevenueValue = (projectId: string, categoryId: string | null, month: number) => {
    const key = `revenue-${projectId}-${categoryId || 'null'}-${month}`;
    if (editingRevenues[key] !== undefined) {
      return editingRevenues[key];
    }
    const revenue = revenues?.find(r => 
      r.project_id === projectId && 
      r.category_id === categoryId &&
      r.month === month
    );
    return revenue?.budgeted_amount ?? 0;
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

  const handleRevenueChange = (projectId: string, categoryId: string | null, month: number, value: string) => {
    const key = `revenue-${projectId}-${categoryId || 'null'}-${month}`;
    const numValue = parseFloat(value) || 0;
    setEditingRevenues(prev => ({ ...prev, [key]: numValue }));
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

  const handleRevenueSave = (projectId: string, categoryId: string | null, month: number) => {
    const key = `revenue-${projectId}-${categoryId || 'null'}-${month}`;
    const amount = editingRevenues[key] ?? getRevenueValue(projectId, categoryId, month);
    saveRevenueMutation.mutate({ projectId, categoryId, month, amount });
    setEditingRevenues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleReplicateToAllMonths = async (projectId: string, categoryId: string | null, sourceMonth: number) => {
    const value = getBudgetValue(projectId, categoryId, sourceMonth);
    if (value === 0) return;
    
    for (let m = 1; m <= 12; m++) {
      if (m !== sourceMonth) {
        await saveMutation.mutateAsync({ projectId, categoryId, month: m, amount: value });
      }
    }
    toast.success("Valor replicado para todos os meses");
  };

  const handleReplicateRevenueToAllMonths = async (projectId: string, categoryId: string | null, sourceMonth: number) => {
    const value = getRevenueValue(projectId, categoryId, sourceMonth);
    if (value === 0) return;
    
    // Save all months including source month
    for (let m = 1; m <= 12; m++) {
      await saveRevenueMutation.mutateAsync({ projectId, categoryId, month: m, amount: value });
    }
    toast.success("Valor replicado para todos os meses");
  };

  const getProjectTotals = (projectId: string) => {
    const projectCategories = getProjectCategories(projectId);
    let totalBudget = 0;
    let totalExpense = 0;

    if (projectCategories.length === 0) {
      for (let m = 1; m <= 12; m++) {
        totalBudget += Number(getBudgetValue(projectId, null, m));
        totalExpense += getProjectExpenseValue(projectId, m);
      }
    } else {
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

  const getProjectRevenueTotals = (projectId: string) => {
    const revenueCategories = getProjectCategories(projectId, true);
    let total = 0;
    
    if (revenueCategories.length === 0) {
      for (let m = 1; m <= 12; m++) {
        total += Number(getRevenueValue(projectId, null, m));
      }
    } else {
      for (const cat of revenueCategories) {
        for (let m = 1; m <= 12; m++) {
          total += Number(getRevenueValue(projectId, cat.id, m));
        }
      }
    }
    return total;
  };

  const getProjectRevenueForMonth = (projectId: string, month: number) => {
    const revenueCategories = getProjectCategories(projectId, true);
    if (revenueCategories.length === 0) {
      return Number(getRevenueValue(projectId, null, month));
    }
    return revenueCategories.reduce((sum, cat) => 
      sum + Number(getRevenueValue(projectId, cat.id, month)), 0
    );
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

  const getCategoryRevenueTotals = (projectId: string, categoryId: string) => {
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      total += Number(getRevenueValue(projectId, categoryId, m));
    }
    return total;
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

  const getGlobalTotals = () => {
    let totalBudget = 0;
    let totalExpense = 0;
    
    projects?.forEach(project => {
      const projectTotals = getProjectTotals(project.id);
      totalBudget += projectTotals.totalBudget;
      totalExpense += projectTotals.totalExpense;
    });
    
    return { totalBudget, totalExpense, variance: totalBudget - totalExpense };
  };

  const getGlobalRevenueTotals = () => {
    let total = 0;
    revenueProjects?.forEach(project => {
      total += getProjectRevenueTotals(project.id);
    });
    return total;
  };

  const getGlobalMonthlyRevenue = (month: number) => {
    if (!revenueProjects) return 0;
    return revenueProjects.reduce((sum, project) => 
      sum + getProjectRevenueForMonth(project.id, month), 0
    );
  };

  const getGlobalMonthlyBudget = (month: number) => {
    if (!projects) return 0;
    return projects.reduce((sum, project) => 
      sum + getProjectBudgetForMonth(project.id, month), 0
    );
  };

  const getGlobalMonthlyExpense = (month: number) => {
    if (!projects) return 0;
    return projects.reduce((sum, project) => 
      sum + getProjectExpenseValue(project.id, month), 0
    );
  };

  // Filter projects that have revenue
  const revenueProjects = projects?.filter(p => p.has_revenue);

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
            {/* Revenue Section */}
            {revenueProjects && revenueProjects.length > 0 && (
              <>
                <tr className="bg-green-50 dark:bg-green-950/30">
                  <td colSpan={16} className="p-2 font-semibold text-green-700 dark:text-green-400 sticky left-0 bg-green-50 dark:bg-green-950/30">
                    Receitas
                  </td>
                </tr>
                {revenueProjects.map(project => {
                  const totalRevenue = getProjectRevenueTotals(project.id);
                  const isExpanded = expandedRevenueProjects.has(project.id);
                  const revenueCategories = getProjectCategories(project.id, true);
                  const hasCategories = revenueCategories.length > 0;
                  
                  return (
                    <>
                      {/* Revenue Project Row */}
                      <tr key={`revenue-${project.id}`} className="border-b hover:bg-muted/50 bg-green-50/50 dark:bg-green-950/20">
                        <td className="p-2 sticky left-0 bg-green-50/50 dark:bg-green-950/20">
                          <div className="flex items-center gap-2">
                            {hasCategories && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleRevenueProject(project.id)}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            )}
                            <span 
                              className="px-2 py-1 rounded text-white text-xs font-medium cursor-pointer"
                              style={{ backgroundColor: project.color || '#3878B5' }}
                              onClick={() => hasCategories && toggleRevenueProject(project.id)}
                            >
                              {project.name}
                            </span>
                          </div>
                        </td>
                        {MONTHS.map((_, monthIndex) => {
                          const month = monthIndex + 1;
                          const monthlyRevenue = getProjectRevenueForMonth(project.id, month);
                          const revenueValue = getRevenueValue(project.id, null, month);
                          
                          return (
                            <td key={month} className="p-1 text-center">
                              {hasCategories ? (
                                <span className="text-xs font-medium">
                                  {monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : '-'}
                                </span>
                              ) : (
                                <div className="flex items-center gap-0.5 justify-center">
                                  <Input
                                    type="number"
                                    value={revenueValue}
                                    onChange={(e) => handleRevenueChange(project.id, null, month, e.target.value)}
                                    className="h-5 text-[10px] text-center w-12 px-1 border-green-200 focus:border-green-400"
                                    placeholder="0"
                                    onBlur={() => handleRevenueSave(project.id, null, month)}
                                  />
                                  {month === 1 && revenueValue > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4"
                                            onClick={() => handleReplicateRevenueToAllMonths(project.id, null, 1)}
                                          >
                                            <Copy className="h-2.5 w-2.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Replicar para todos os meses</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-medium text-green-600">
                          {formatCurrency(totalRevenue)}
                        </td>
                        <td className="p-2 text-center">-</td>
                        <td className="p-2 text-center">-</td>
                      </tr>

                      {/* Revenue Category Rows */}
                      {isExpanded && revenueCategories.map(category => {
                        const catTotals = getCategoryRevenueTotals(project.id, category.id);

                        return (
                          <tr key={`revenue-cat-${category.id}`} className="border-b bg-green-50/30 dark:bg-green-950/10">
                            <td className="p-2 pl-10 sticky left-0 bg-green-50/30 dark:bg-green-950/10">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: category.color || '#3878B5' }}
                                />
                                <span className="text-xs truncate max-w-[120px]">{category.name}</span>
                              </div>
                            </td>
                            {MONTHS.map((_, monthIndex) => {
                              const month = monthIndex + 1;
                              const revenueValue = getRevenueValue(project.id, category.id, month);
                              const key = `revenue-${project.id}-${category.id}-${month}`;
                              const isEditing = editingRevenues[key] !== undefined;
                              
                              return (
                                <td key={month} className="p-1 text-center">
                                  <div className="flex items-center gap-0.5 justify-center">
                                    <Input
                                      type="number"
                                      value={revenueValue}
                                      onChange={(e) => handleRevenueChange(project.id, category.id, month, e.target.value)}
                                      className="h-5 text-[10px] text-center w-12 px-1 border-green-200 focus:border-green-400"
                                      placeholder="0"
                                      onBlur={() => handleRevenueSave(project.id, category.id, month)}
                                    />
                                    {month === 1 && revenueValue > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-4 w-4"
                                              onClick={() => handleReplicateRevenueToAllMonths(project.id, category.id, 1)}
                                            >
                                              <Copy className="h-2.5 w-2.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Replicar para todos os meses</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-2 text-center font-medium text-green-600">
                              {formatCurrency(catTotals)}
                            </td>
                            <td className="p-2 text-center">-</td>
                            <td className="p-2 text-center">-</td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
                {/* Revenue Total Row */}
                <tr className="border-b bg-green-100/50 dark:bg-green-950/40 font-semibold">
                  <td className="p-2 sticky left-0 bg-green-100/50 dark:bg-green-950/40">
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">Total Receitas</span>
                  </td>
                  {MONTHS.map((_, monthIndex) => {
                    const month = monthIndex + 1;
                    const monthlyRevenue = getGlobalMonthlyRevenue(month);
                    
                    return (
                      <td key={month} className="p-1 text-center">
                        <span className="text-xs font-bold text-green-600">
                          {monthlyRevenue > 0 ? formatCurrency(monthlyRevenue) : '-'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center text-sm font-bold text-green-600">
                    {formatCurrency(getGlobalRevenueTotals())}
                  </td>
                  <td className="p-2 text-center">-</td>
                  <td className="p-2 text-center">-</td>
                </tr>
                <tr>
                  <td colSpan={16} className="h-4"></td>
                </tr>
              </>
            )}

            {/* Expenses Section Header */}
            <tr className="bg-red-50 dark:bg-red-950/30">
              <td colSpan={16} className="p-2 font-semibold text-red-700 dark:text-red-400 sticky left-0 bg-red-50 dark:bg-red-950/30">
                Despesas por Projeto
              </td>
            </tr>

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
                              <div className="flex items-center gap-0.5 justify-center">
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
                                    className="h-5 w-5"
                                    onClick={() => handleSave(project.id, null, month)}
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                )}
                                {month === 1 && getBudgetValue(project.id, null, 1) > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          onClick={() => handleReplicateToAllMonths(project.id, null, 1)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Replicar para todos os meses</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color || '#888' }}
                            />
                            <span className="text-xs truncate max-w-[120px]">{category.name}</span>
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
                                <div className="flex items-center gap-0.5 justify-center">
                                  <Input
                                    type="number"
                                    value={budgetValue}
                                    onChange={(e) => handleBudgetChange(project.id, category.id, month, e.target.value)}
                                    className="h-5 text-[10px] text-center w-12 px-1"
                                    placeholder="0"
                                  />
                                  {isEditing && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4"
                                      onClick={() => handleSave(project.id, category.id, month)}
                                    >
                                      <Save className="h-2.5 w-2.5" />
                                    </Button>
                                  )}
                                  {month === 1 && budgetValue > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4"
                                            onClick={() => handleReplicateToAllMonths(project.id, category.id, 1)}
                                          >
                                            <Copy className="h-2.5 w-2.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Replicar para todos os meses</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
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
            
            {/* Total Row */}
            {projects && projects.length > 0 && (() => {
              const globalTotals = getGlobalTotals();
              return (
                <tr className="border-t-2 border-primary bg-muted/50 font-semibold">
                  <td className="p-2 sticky left-0 bg-muted/50">
                    <span className="text-sm font-bold">Total Geral Despesas</span>
                  </td>
                  {MONTHS.map((_, monthIndex) => {
                    const month = monthIndex + 1;
                    const budgetValue = getGlobalMonthlyBudget(month);
                    const expenseValue = getGlobalMonthlyExpense(month);
                    
                    return (
                      <td key={month} className="p-1 text-center">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold">
                            {budgetValue > 0 ? formatCurrency(budgetValue) : '-'}
                          </span>
                          {expenseValue > 0 && (
                            <span className={`text-xs ${expenseValue > budgetValue && budgetValue > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {formatCurrency(expenseValue)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center text-sm font-bold">
                    {formatCurrency(globalTotals.totalBudget)}
                  </td>
                  <td className="p-2 text-center text-sm font-bold text-red-600">
                    {formatCurrency(globalTotals.totalExpense)}
                  </td>
                  <td className={`p-2 text-center text-sm font-bold ${globalTotals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(globalTotals.variance)}
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
