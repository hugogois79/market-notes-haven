import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, FolderOpen, Calendar, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface FinancialDashboardProps {
  companyId: string;
}

export default function FinancialDashboard({ companyId }: FinancialDashboardProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Calculate date ranges
  const startOfYear = `${currentYear}-01-01`;
  const endOfYear = `${currentYear}-12-31`;
  const startOfMonth = format(new Date(currentYear, currentMonth, 1), 'yyyy-MM-dd');
  const endOfMonth = format(new Date(currentYear, currentMonth + 1, 0), 'yyyy-MM-dd');
  const monthName = format(now, 'MMMM', { locale: pt });

  const { data: transactions } = useQuery({
    queryKey: ["transactions-dashboard", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("company_id", companyId);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts-dashboard", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch project expenses for current year
  const { data: projectExpenses } = useQuery({
    queryKey: ["project-expenses-dashboard", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("total_cost, start_date, created_at")
        .gte("created_at", startOfYear)
        .lte("created_at", endOfYear);
      
      if (error) throw error;
      return data;
    },
  });

  // Filter transactions by year
  const yearTransactions = transactions?.filter(t => {
    const txDate = new Date(t.date);
    return txDate.getFullYear() === currentYear;
  }) || [];

  // Filter transactions by month
  const monthTransactions = transactions?.filter(t => {
    const txDate = new Date(t.date);
    return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
  }) || [];

  // Calculate YEAR KPIs
  const yearIncome = yearTransactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const yearExpenses = yearTransactions.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const yearProfit = yearIncome - yearExpenses;
  const yearProfitMargin = yearIncome > 0 ? (yearProfit / yearIncome) * 100 : 0;

  // Calculate MONTH KPIs
  const monthIncome = monthTransactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const monthProfit = monthIncome - monthExpenses;
  const monthProfitMargin = monthIncome > 0 ? (monthProfit / monthIncome) * 100 : 0;
  
  const totalBalance = bankAccounts?.reduce(
    (sum, acc) => sum + Number(acc.current_balance), 0
  ) || 0;

  // Calculate total project expenses for the year
  const totalProjectExpenses = projectExpenses?.reduce(
    (sum, proj) => sum + Number(proj.total_cost || 0), 0
  ) || 0;

  const monthKpis = [
    {
      title: "Receitas",
      value: formatCurrency(monthIncome),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesas",
      value: formatCurrency(monthExpenses),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Lucro",
      value: formatCurrency(monthProfit),
      description: `Margem: ${monthProfitMargin.toFixed(1)}%`,
      icon: DollarSign,
      color: monthProfit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: monthProfit >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ];

  const yearKpis = [
    {
      title: "Receitas",
      value: formatCurrency(yearIncome),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesas",
      value: formatCurrency(yearExpenses),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Despesas Projetos",
      value: formatCurrency(totalProjectExpenses),
      description: `${projectExpenses?.length || 0} projetos`,
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Lucro",
      value: formatCurrency(yearProfit),
      description: `Margem: ${yearProfitMargin.toFixed(1)}%`,
      icon: DollarSign,
      color: yearProfit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: yearProfit >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Saldo Total",
      value: formatCurrency(totalBalance),
      description: `${bankAccounts?.length || 0} contas`,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  const renderKpiList = (kpis: typeof monthKpis) => (
    <div className="divide-y">
      {kpis.map((kpi) => (
        <div 
          key={kpi.title}
          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </p>
              {kpi.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kpi.description}
                </p>
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold ${kpi.color}`}>
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{monthName} {currentYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderKpiList(monthKpis)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Ano {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderKpiList(yearKpis)}
        </CardContent>
      </Card>
    </div>
  );
}
