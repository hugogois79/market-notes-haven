import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FinancialDashboardProps {
  companyId: string;
}

export default function FinancialDashboard({ companyId }: FinancialDashboardProps) {
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

  // Calculate KPIs
  const income = transactions?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
  
  const expenses = transactions?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
  
  const profit = income - expenses;
  const profitMargin = income > 0 ? (profit / income) * 100 : 0;
  
  const totalBalance = bankAccounts?.reduce(
    (sum, acc) => sum + Number(acc.current_balance), 0
  ) || 0;

  const kpis = [
    {
      title: "Receitas",
      value: formatCurrency(income),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesas",
      value: formatCurrency(expenses),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Lucro",
      value: formatCurrency(profit),
      description: `Margem: ${profitMargin.toFixed(1)}%`,
      icon: DollarSign,
      color: profit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: profit >= 0 ? "bg-green-50" : "bg-red-50",
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpi.color}`}>
              {kpi.value}
            </div>
            {kpi.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {kpi.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
