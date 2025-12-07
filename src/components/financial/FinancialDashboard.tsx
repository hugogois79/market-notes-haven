import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, FolderOpen } from "lucide-react";
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

  // Fetch all project expenses (total_cost is calculated from expenses)
  
  const { data: projectExpenses } = useQuery({
    queryKey: ["project-expenses-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("total_cost");
      
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

  // Calculate total project expenses for the year
  const totalProjectExpenses = projectExpenses?.reduce(
    (sum, proj) => sum + Number(proj.total_cost || 0), 0
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
      title: "Despesas Projetos",
      value: formatCurrency(totalProjectExpenses),
      description: `${projectExpenses?.length || 0} projetos`,
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
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
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {kpis.map((kpi, index) => (
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
      </CardContent>
    </Card>
  );
}
