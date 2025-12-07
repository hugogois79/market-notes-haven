import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FinancialDashboardProps {
  companyId: string;
}

export default function FinancialDashboard({ companyId }: FinancialDashboardProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const { data: transactions } = useQuery({
    queryKey: ["transactions-dashboard", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("company_id", companyId)
        .gte("date", startOfYear);
      
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

  const { data: expenseClaimsExpenses } = useQuery({
    queryKey: ["expense-claims-expenses-dashboard", startOfYear, endOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, expense_date")
        .gte("expense_date", startOfYear)
        .lte("expense_date", endOfMonth);
      
      if (error) throw error;
      return data;
    },
  });

  // Filter transactions by period
  const yearTransactions = transactions || [];
  const monthTransactions = yearTransactions.filter(t => {
    const date = t.date;
    return date >= startOfMonth && date <= endOfMonth;
  });

  // Calculate Annual KPIs
  const yearIncome = yearTransactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const yearTransactionExpenses = yearTransactions.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  // Calculate expenses from expense claims (by period)
  const yearClaimsExpenses = expenseClaimsExpenses?.reduce(
    (sum, e) => sum + Number(e.amount || 0), 0
  ) || 0;

  const monthClaimsExpenses = expenseClaimsExpenses?.filter(e => {
    const date = e.expense_date;
    return date >= startOfMonth && date <= endOfMonth;
  }).reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

  const yearExpenses = yearTransactionExpenses + yearClaimsExpenses;
  
  // Calculate Monthly KPIs
  const monthIncome = monthTransactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
  
  const monthTransactionExpenses = monthTransactions.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  const monthExpenses = monthTransactionExpenses + monthClaimsExpenses;

  const yearProfit = yearIncome - yearExpenses;
  const yearMargin = yearIncome > 0 ? (yearProfit / yearIncome) * 100 : 0;

  const monthProfit = monthIncome - monthExpenses;
  const monthMargin = monthIncome > 0 ? (monthProfit / monthIncome) * 100 : 0;
  
  const totalBalance = bankAccounts?.reduce(
    (sum, acc) => sum + Number(acc.current_balance), 0
  ) || 0;

  const kpis = [
    {
      title: "Receitas",
      icon: TrendingUp,
      monthValue: monthIncome,
      yearValue: yearIncome,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesas",
      icon: TrendingDown,
      monthValue: monthExpenses,
      yearValue: yearExpenses,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Lucro",
      icon: DollarSign,
      monthValue: monthProfit,
      yearValue: yearProfit,
      monthDescription: `Margem: ${monthMargin.toFixed(1)}%`,
      yearDescription: `Margem: ${yearMargin.toFixed(1)}%`,
      colorMonth: monthProfit >= 0 ? "text-green-600" : "text-red-600",
      colorYear: yearProfit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: yearProfit >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Saldo Total",
      icon: Wallet,
      monthValue: totalBalance,
      yearValue: totalBalance,
      description: `${bankAccounts?.length || 0} contas`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      singleValue: true,
    },
  ];

  const monthName = now.toLocaleDateString('pt-PT', { month: 'long' });

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center border-b p-4 bg-muted/30">
          <div className="flex-1" />
          <div className="w-32 text-center text-sm font-medium text-muted-foreground capitalize">
            {monthName}
          </div>
          <div className="w-32 text-center text-sm font-medium text-muted-foreground">
            Anual {currentYear}
          </div>
        </div>
        
        {/* Rows */}
        <div className="divide-y">
          {kpis.map((kpi) => (
            <div 
              key={kpi.title}
              className="flex items-center p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color || kpi.colorYear}`} />
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
              
              {kpi.singleValue ? (
                <>
                  <div className="w-32 text-center text-lg font-bold text-muted-foreground">
                    —
                  </div>
                  <div className={`w-32 text-center text-lg font-bold ${kpi.color}`}>
                    {formatCurrency(kpi.yearValue)}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-32 text-center">
                    <div className={`text-lg font-bold ${kpi.colorMonth || kpi.color}`}>
                      {formatCurrency(kpi.monthValue)}
                    </div>
                    {kpi.monthDescription && (
                      <p className="text-xs text-muted-foreground">{kpi.monthDescription}</p>
                    )}
                  </div>
                  <div className="w-32 text-center">
                    <div className={`text-lg font-bold ${kpi.colorYear || kpi.color}`}>
                      {formatCurrency(kpi.yearValue)}
                    </div>
                    {kpi.yearDescription && (
                      <p className="text-xs text-muted-foreground">{kpi.yearDescription}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
