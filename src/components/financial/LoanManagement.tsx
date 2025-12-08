import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, List, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import LoanDialog from "./LoanDialog";
import LoanPayments from "./LoanPayments";

interface LoanManagementProps {
  companyId: string;
}

export default function LoanManagement({ companyId }: LoanManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: loans } = useQuery({
    queryKey: ["company-loans", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_loans")
        .select("*")
        .or(`lending_company_id.eq.${companyId},borrowing_company_id.eq.${companyId}`)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      
      // Fetch company names separately
      const companyIds = [...new Set([
        ...data.map(l => l.lending_company_id),
        ...data.map(l => l.borrowing_company_id)
      ])];
      
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);
      
      const companyMap = new Map(companies?.map(c => [c.id, c]) || []);
      
      return data.map(loan => ({
        ...loan,
        lending_company: companyMap.get(loan.lending_company_id),
        borrowing_company: companyMap.get(loan.borrowing_company_id)
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_loans")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-loans", companyId] });
      toast.success("Empréstimo eliminado");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      paid: "secondary",
      overdue: "destructive",
      cancelled: "outline",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      paid: "Pago",
      overdue: "Em Atraso",
      cancelled: "Cancelado",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // Calculate balance summary
  const balanceSummary = useMemo(() => {
    if (!loans) return { totalLent: 0, totalBorrowed: 0, netBalance: 0, lentCount: 0, borrowedCount: 0 };
    
    let totalLent = 0;
    let totalBorrowed = 0;
    let lentCount = 0;
    let borrowedCount = 0;
    
    loans.filter(l => l.status === 'active').forEach(loan => {
      if (loan.lending_company_id === companyId) {
        totalLent += Number(loan.amount);
        lentCount++;
      } else {
        totalBorrowed += Number(loan.amount);
        borrowedCount++;
      }
    });
    
    return {
      totalLent,
      totalBorrowed,
      netBalance: totalLent - totalBorrowed,
      lentCount,
      borrowedCount
    };
  }, [loans, companyId]);

  // Show payments view if a loan is selected
  if (selectedLoan) {
    return (
      <LoanPayments 
        loan={selectedLoan} 
        onBack={() => setSelectedLoan(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Empréstimos Inter-empresas</h2>
          <p className="text-muted-foreground">Gerir empréstimos entre empresas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Empréstimo
        </Button>
      </div>

      {/* Balance Dashboard */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(balanceSummary.totalLent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {balanceSummary.lentCount} empréstimo(s) ativo(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <TrendingDown className="h-4 w-4" />
              A Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {formatCurrency(balanceSummary.totalBorrowed)}
            </div>
            <p className="text-xs text-muted-foreground">
              {balanceSummary.borrowedCount} empréstimo(s) ativo(s)
            </p>
          </CardContent>
        </Card>

        <Card className={`${balanceSummary.netBalance >= 0 ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balanço Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceSummary.netBalance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
              {balanceSummary.netBalance >= 0 ? '+' : ''}{formatCurrency(balanceSummary.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {balanceSummary.netBalance >= 0 ? 'Posição credora' : 'Posição devedora'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loans?.map((loan) => {
          const isLending = loan.lending_company_id === companyId;
          return (
            <Card key={loan.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">
                    {isLending ? "Empréstimo a" : "Emprestado de"}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedLoan(loan)}
                      title="Ver movimentos"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingLoan(loan);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Eliminar empréstimo?")) {
                          deleteMutation.mutate(loan.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Empresa:</span>{" "}
                  {isLending 
                    ? loan.borrowing_company?.name 
                    : loan.lending_company?.name}
                </div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(Number(loan.amount))}
                </div>
                {loan.interest_rate > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Taxa de Juro:</span> {loan.interest_rate}%
                  </div>
                )}
                {loan.monthly_payment && (
                  <div className="text-sm">
                    <span className="font-medium">Prestação Mensal:</span>{" "}
                    {formatCurrency(Number(loan.monthly_payment))}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Início:</span>{" "}
                  {new Date(loan.start_date).toLocaleDateString("pt-PT")}
                </div>
                {loan.end_date && (
                  <div className="text-sm">
                    <span className="font-medium">Fim:</span>{" "}
                    {new Date(loan.end_date).toLocaleDateString("pt-PT")}
                  </div>
                )}
                <div>{getStatusBadge(loan.status)}</div>
                {loan.description && (
                  <p className="text-sm text-muted-foreground">
                    {loan.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LoanDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingLoan(null);
        }}
        companyId={companyId}
        loan={editingLoan}
      />
    </div>
  );
}
