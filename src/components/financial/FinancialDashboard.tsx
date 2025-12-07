import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, FolderOpen } from "lucide-react";
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

  // Fetch project expenses for current year (from expense_projects total)
  const { data: projectExpenses } = useQuery({
    queryKey: ["project-expenses-dashboard", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("total_cost, start_date, created_at");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch actual expenses by date for monthly breakdown
  const { data: expenseItems } = useQuery({
    queryKey: ["expense-items-dashboard", currentYear, currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, expense_date");
      
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

  // Calculate MONTH KPIs
  const monthIncome = monthTransactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const monthProfit = monthIncome - monthExpenses;
  
  const totalBalance = bankAccounts?.reduce(
    (sum, acc) => sum + Number(acc.current_balance), 0
  ) || 0;

  // Calculate total project expenses for the year (from expense_projects)
  const totalProjectExpenses = projectExpenses?.reduce(
    (sum, proj) => sum + Number(proj.total_cost || 0), 0
  ) || 0;

  // Calculate monthly project expenses from actual expense items
  const monthProjectExpenses = expenseItems?.filter(exp => {
    const expDate = new Date(exp.expense_date);
    return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
  }).reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0;

  const kpis = [
    {
      title: "Receitas",
      monthValue: monthIncome,
      yearValue: yearIncome,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesas",
      monthValue: monthExpenses,
      yearValue: yearExpenses,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Despesas Projetos",
      monthValue: monthProjectExpenses,
      yearValue: totalProjectExpenses,
      description: `${projectExpenses?.length || 0} projetos`,
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Lucro",
      monthValue: monthProfit,
      yearValue: yearProfit,
      icon: DollarSign,
      getColor: (value: number) => value >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Saldo Total",
      monthValue: null,
      yearValue: totalBalance,
      description: `${bankAccounts?.length || 0} contas`,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="w-1/3"></div>
          <div className="w-1/3 text-center">
            <span className="text-sm font-semibold text-muted-foreground capitalize">
              {monthName}
            </span>
          </div>
          <div className="w-1/3 text-center">
            <span className="text-sm font-semibold text-muted-foreground">
              Ano {currentYear}
            </span>
          </div>
        </div>
        
        {/* KPI Rows */}
        <div className="divide-y">
          {kpis.map((kpi) => {
            const monthColor = kpi.getColor ? kpi.getColor(kpi.monthValue || 0) : kpi.color;
            const yearColor = kpi.getColor ? kpi.getColor(kpi.yearValue || 0) : kpi.color;
            
            return (
              <div 
                key={kpi.title}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Label */}
                <div className="flex items-center gap-3 w-1/3">
                  <div className={`p-2 rounded-lg ${kpi.bgColor || (kpi.getColor ? (kpi.yearValue && kpi.yearValue >= 0 ? "bg-green-50" : "bg-red-50") : "bg-gray-50")}`}>
                    <kpi.icon className={`h-5 w-5 ${yearColor}`} />
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
                
                {/* Month Value */}
                <div className="w-1/3 text-center">
                  {kpi.monthValue !== null ? (
                    <span className={`text-xl font-bold ${monthColor}`}>
                      {formatCurrency(kpi.monthValue)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                
                {/* Year Value */}
                <div className="w-1/3 text-center">
                  <span className={`text-xl font-bold ${yearColor}`}>
                    {formatCurrency(kpi.yearValue)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
