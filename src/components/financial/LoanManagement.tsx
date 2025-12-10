import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoanDialog from "./LoanDialog";
import LoanPaymentDialog from "./LoanPaymentDialog";

interface LoanManagementProps {
  companyId: string;
}

export default function LoanManagement({ companyId }: LoanManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set());
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: loans, isLoading } = useQuery({
    queryKey: ["company-loans", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_loans")
        .select("*")
        .or(`lending_company_id.eq.${companyId},borrowing_company_id.eq.${companyId}`)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      
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

  const { data: allPayments } = useQuery({
    queryKey: ["all-loan-payments", companyId],
    queryFn: async () => {
      if (!loans || loans.length === 0) return [];
      
      const loanIds = loans.map(l => l.id);
      const { data, error } = await supabase
        .from("loan_payments")
        .select(`
          *,
          paying_company:companies!loan_payments_paying_company_id_fkey(id, name),
          receiving_company:companies!loan_payments_receiving_company_id_fkey(id, name)
        `)
        .in("loan_id", loanIds)
        .order("payment_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!loans && loans.length > 0,
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-loans", companyId] });
      toast.success("Empréstimo eliminado");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loan_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-loan-payments", companyId] });
      toast.success("Pagamento eliminado");
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  // Group loans by other company (the one that's not the selected company)
  const groupedLoans = useMemo(() => {
    if (!loans) return { lending: new Map(), borrowing: new Map() };
    
    const lending = new Map<string, { company: any; loans: any[] }>();
    const borrowing = new Map<string, { company: any; loans: any[] }>();
    
    loans.forEach(loan => {
      if (loan.lending_company_id === companyId) {
        // Current company is lending
        const otherCompany = loan.borrowing_company;
        if (!lending.has(otherCompany?.id)) {
          lending.set(otherCompany?.id, { company: otherCompany, loans: [] });
        }
        lending.get(otherCompany?.id)?.loans.push(loan);
      } else {
        // Current company is borrowing
        const otherCompany = loan.lending_company;
        if (!borrowing.has(otherCompany?.id)) {
          borrowing.set(otherCompany?.id, { company: otherCompany, loans: [] });
        }
        borrowing.get(otherCompany?.id)?.loans.push(loan);
      }
    });
    
    return { lending, borrowing };
  }, [loans, companyId]);

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
    
    return { totalLent, totalBorrowed, netBalance: totalLent - totalBorrowed, lentCount, borrowedCount };
  }, [loans, companyId]);

  const toggleCompany = (otherCompanyId: string) => {
    const newSet = new Set(expandedCompanies);
    if (newSet.has(otherCompanyId)) {
      newSet.delete(otherCompanyId);
    } else {
      newSet.add(otherCompanyId);
    }
    setExpandedCompanies(newSet);
  };

  const toggleLoan = (loanId: string) => {
    const newSet = new Set(expandedLoans);
    if (newSet.has(loanId)) {
      newSet.delete(loanId);
    } else {
      newSet.add(loanId);
    }
    setExpandedLoans(newSet);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
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
    return <Badge variant={variants[status]} className="text-[10px] px-1.5 py-0">{labels[status]}</Badge>;
  };

  const getPaymentsForLoan = (loanId: string) => {
    return allPayments?.filter(p => p.loan_id === loanId) || [];
  };

  const getTotalPaidForLoan = (loanId: string) => {
    return getPaymentsForLoan(loanId).reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const renderLoansTable = (title: string, groupedData: Map<string, { company: any; loans: any[] }>, isLending: boolean) => {
    if (groupedData.size === 0) return null;
    
    const totalAmount = Array.from(groupedData.values())
      .flatMap(g => g.loans)
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + Number(l.amount), 0);

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className={`${isLending ? 'bg-green-50 dark:bg-green-950/30' : 'bg-orange-50 dark:bg-orange-950/30'} hover:bg-opacity-100`}>
              <TableHead className="py-2 px-3 text-xs font-medium w-8"></TableHead>
              <TableHead className={`py-2 px-3 text-xs font-semibold ${isLending ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                {title}
              </TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium">Data</TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium">Status</TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium">Descrição</TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium text-right">Valor</TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium text-right">Pago</TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium text-right">Restante</TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium text-center">Anexo</TableHead>
              <TableHead className="py-2 px-3 text-xs font-medium text-right">
                <span className={`font-bold ${isLending ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                  {formatCurrency(totalAmount)}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(groupedData.entries()).map(([otherCompanyId, { company, loans: companyLoans }]) => {
              const isCompanyExpanded = expandedCompanies.has(otherCompanyId);
              const companyTotal = companyLoans.filter(l => l.status === 'active').reduce((sum, l) => sum + Number(l.amount), 0);
              
              return (
                <>
                  {/* Company Header Row */}
                  <TableRow 
                    key={`company-${otherCompanyId}`}
                    className="bg-muted/50 hover:bg-muted/60 cursor-pointer"
                    onClick={() => toggleCompany(otherCompanyId)}
                  >
                    <TableCell className="py-2 px-3">
                      {isCompanyExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell colSpan={7} className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${isLending ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                          {company?.name || 'Empresa'}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {companyLoans.length}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className={`text-xs font-medium ${isLending ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatCurrency(companyTotal)}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Loan Rows */}
                  {isCompanyExpanded && companyLoans.map((loan) => {
                    const isLoanExpanded = expandedLoans.has(loan.id);
                    const payments = getPaymentsForLoan(loan.id);
                    const totalPaid = getTotalPaidForLoan(loan.id);
                    const remaining = Number(loan.amount) - totalPaid;

                    return (
                      <>
                        <TableRow key={loan.id} className="hover:bg-muted/20">
                          <TableCell className="py-1.5 px-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLoan(loan.id);
                              }}
                            >
                              {isLoanExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="py-1.5 px-3"></TableCell>
                          <TableCell className="py-1.5 px-3 text-xs">{formatDate(loan.start_date)}</TableCell>
                          <TableCell className="py-1.5 px-3">{getStatusBadge(loan.status)}</TableCell>
                          <TableCell className="py-1.5 px-3 text-xs max-w-[200px] truncate">
                            {loan.description || '-'}
                          </TableCell>
                          <TableCell className="py-1.5 px-3 text-right text-xs font-medium">
                            {formatCurrency(Number(loan.amount))}
                          </TableCell>
                          <TableCell className="py-1.5 px-3 text-right text-xs text-green-600">
                            {formatCurrency(totalPaid)}
                          </TableCell>
                          <TableCell className={`py-1.5 px-3 text-right text-xs font-medium ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {formatCurrency(remaining)}
                          </TableCell>
                          <TableCell className="py-1.5 px-3 text-center">
                            {loan.attachment_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(loan.attachment_url);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    const filename = loan.attachment_url.split('/').pop() || 'anexo';
                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Error downloading file:', error);
                                    window.open(loan.attachment_url, '_blank');
                                  }
                                }}
                              >
                                <Paperclip className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 px-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLoanForPayment(loan);
                                  setPaymentDialogOpen(true);
                                }}
                                title="Novo pagamento"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLoan(loan);
                                  setDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Eliminar empréstimo?")) {
                                    deleteLoanMutation.mutate(loan.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Payment Rows */}
                        {isLoanExpanded && payments.map((payment) => (
                          <TableRow key={payment.id} className="bg-muted/10 hover:bg-muted/20">
                            <TableCell className="py-1 px-3"></TableCell>
                            <TableCell className="py-1 px-3"></TableCell>
                            <TableCell className="py-1 px-3 text-xs text-muted-foreground pl-8">
                              {formatDate(payment.payment_date)}
                            </TableCell>
                            <TableCell className="py-1 px-3">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300">
                                Pagamento
                              </Badge>
                            </TableCell>
                            <TableCell className="py-1 px-3 text-xs text-muted-foreground max-w-[200px] truncate">
                              {payment.notes || '-'}
                            </TableCell>
                            <TableCell className="py-1 px-3"></TableCell>
                            <TableCell className="py-1 px-3 text-right text-xs text-green-600 font-medium">
                              {formatCurrency(Number(payment.amount))}
                            </TableCell>
                            <TableCell className="py-1 px-3"></TableCell>
                            <TableCell className="py-1 px-3"></TableCell>
                            <TableCell className="py-1 px-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => {
                                    setSelectedLoanForPayment(loan);
                                    setEditingPayment(payment);
                                    setPaymentDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => {
                                    if (confirm("Eliminar pagamento?")) {
                                      deletePaymentMutation.mutate(payment.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                        {isLoanExpanded && payments.length === 0 && (
                          <TableRow className="bg-muted/10">
                            <TableCell colSpan={10} className="py-2 px-3 text-center text-xs text-muted-foreground">
                              Nenhum pagamento registado
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

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

      {/* Loans Tables */}
      <div className="space-y-4">
        {renderLoansTable("A Receber (Empréstimos Concedidos)", groupedLoans.lending, true)}
        {renderLoansTable("A Pagar (Empréstimos Recebidos)", groupedLoans.borrowing, false)}
        
        {groupedLoans.lending.size === 0 && groupedLoans.borrowing.size === 0 && (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            {isLoading ? "A carregar..." : "Nenhum empréstimo registado"}
          </div>
        )}
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

      {selectedLoanForPayment && (
        <LoanPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={(open) => {
            setPaymentDialogOpen(open);
            if (!open) {
              setEditingPayment(null);
              setSelectedLoanForPayment(null);
            }
          }}
          loan={selectedLoanForPayment}
          payment={editingPayment}
        />
      )}
    </div>
  );
}
