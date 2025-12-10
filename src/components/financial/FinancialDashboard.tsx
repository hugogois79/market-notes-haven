import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FinancialDashboardProps {
  companyId: string;
}

interface CompanyExpenseBreakdown {
  companyId: string;
  companyName: string;
  monthValue: number;
  yearValue: number;
}

export default function FinancialDashboard({ companyId }: FinancialDashboardProps) {
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  // Fetch ALL transactions (not filtered by company) for expenses row
  const { data: allTransactions } = useQuery({
    queryKey: ["all-transactions-dashboard", startOfYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("id, date, type, total_amount, company_id")
        .gte("date", startOfYear);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch companies for breakdown display
  const { data: companies } = useQuery({
    queryKey: ["companies-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch transactions filtered by selected company (for income/other KPIs)
  const { data: transactions } = useQuery({
    queryKey: ["transactions-dashboard", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("id, date, type, total_amount, company_id")
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

  // Calculate ALL expenses from all companies
  const allYearExpenses = allTransactions?.filter(t => t.type === 'expense') || [];
  const allMonthExpenses = allYearExpenses.filter(t => {
    const date = t.date;
    return date >= startOfMonth && date <= endOfMonth;
  });

  const totalAllYearExpenses = allYearExpenses.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const totalAllMonthExpenses = allMonthExpenses.reduce((sum, t) => sum + Number(t.total_amount), 0);

  // Calculate breakdown by company
  const companyBreakdown: CompanyExpenseBreakdown[] = (companies || []).map(company => {
    const companyYearExpenses = allYearExpenses
      .filter(t => t.company_id === company.id)
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
    
    const companyMonthExpenses = allMonthExpenses
      .filter(t => t.company_id === company.id)
      .reduce((sum, t) => sum + Number(t.total_amount), 0);

    return {
      companyId: company.id,
      companyName: company.name,
      monthValue: companyMonthExpenses,
      yearValue: companyYearExpenses,
    };
  }).filter(b => b.yearValue > 0 || b.monthValue > 0);

  // Calculate Annual KPIs for selected company
  const yearIncome = yearTransactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  // Calculate expenses from expense claims (by period)
  const yearClaimsExpenses = expenseClaimsExpenses?.reduce(
    (sum, e) => sum + Number(e.amount || 0), 0
  ) || 0;

  const monthClaimsExpenses = expenseClaimsExpenses?.filter(e => {
    const date = e.expense_date;
    return date >= startOfMonth && date <= endOfMonth;
  }).reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

  const yearExpenses = totalAllYearExpenses + yearClaimsExpenses;
  
  // Calculate Monthly KPIs
  const monthIncome = monthTransactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  const monthExpenses = totalAllMonthExpenses + monthClaimsExpenses;

  const yearProfit = yearIncome - yearExpenses;
  const yearMargin = yearIncome > 0 ? (yearProfit / yearIncome) * 100 : 0;

  const monthProfit = monthIncome - monthExpenses;
  const monthMargin = monthIncome > 0 ? (monthProfit / monthIncome) * 100 : 0;
  
  const totalBalance = bankAccounts?.reduce(
    (sum, acc) => sum + Number(acc.current_balance), 0
  ) || 0;

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
          {/* Receitas */}
          <div className="flex items-center p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Receitas</p>
            </div>
            <div className="w-32 text-center">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(monthIncome)}
              </div>
            </div>
            <div className="w-32 text-center">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(yearIncome)}
              </div>
            </div>
          </div>

          {/* Despesas - Expandable */}
          <Collapsible open={expensesExpanded} onOpenChange={setExpensesExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-red-50">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    {expensesExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                  </div>
                </div>
                <div className="w-32 text-center">
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(totalAllMonthExpenses)}
                  </div>
                </div>
                <div className="w-32 text-center">
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(totalAllYearExpenses)}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {companyBreakdown.map((company) => (
                <div 
                  key={company.companyId}
                  className="flex items-center p-3 pl-16 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{company.companyName}</p>
                  </div>
                  <div className="w-32 text-center">
                    <div className="text-sm font-medium text-red-600">
                      {formatCurrency(company.monthValue)}
                    </div>
                  </div>
                  <div className="w-32 text-center">
                    <div className="text-sm font-medium text-red-600">
                      {formatCurrency(company.yearValue)}
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Expense Claims */}
          <div className="flex items-center p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-orange-50">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Expense Claims</p>
            </div>
            <div className="w-32 text-center">
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(monthClaimsExpenses)}
              </div>
            </div>
            <div className="w-32 text-center">
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(yearClaimsExpenses)}
              </div>
            </div>
          </div>

          {/* Lucro */}
          <div className="flex items-center p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-2 rounded-lg ${yearProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <DollarSign className={`h-5 w-5 ${yearProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Lucro</p>
            </div>
            <div className="w-32 text-center">
              <div className={`text-lg font-bold ${monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Margem: {monthMargin.toFixed(1)}%</p>
            </div>
            <div className="w-32 text-center">
              <div className={`text-lg font-bold ${yearProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(yearProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Margem: {yearMargin.toFixed(1)}%</p>
            </div>
          </div>

          {/* Saldo Total */}
          <div className="flex items-center p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-blue-50">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                <p className="text-xs text-muted-foreground mt-0.5">{bankAccounts?.length || 0} contas</p>
              </div>
            </div>
            <div className="w-32 text-center text-lg font-bold text-muted-foreground">
              —
            </div>
            <div className="w-32 text-center">
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(totalBalance)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
