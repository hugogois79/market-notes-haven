import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import ExpenseCard from "@/components/expenses/ExpenseCard";

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Fetch expense claims with requester info
  const { data: claims, isLoading } = useQuery({
    queryKey: ["expense-claims-with-requester", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('expense_claims')
        .select(`
          *,
          expense_users (
            id,
            name
          )
        `)
        .order('claim_date', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  // Group claims by month
  const groupedClaims = useMemo(() => {
    if (!claims || claims.length === 0) return [];

    const groups: Record<string, { monthKey: string; label: string; claims: any[]; total: number }> = {};

    claims.forEach((claim) => {
      const date = new Date(claim.claim_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey,
          label,
          claims: [],
          total: 0,
        };
      }

      groups[monthKey].claims.push(claim);
      groups[monthKey].total += Number(claim.total_amount);
    });

    // Sort claims within each group by date descending
    Object.values(groups).forEach((group) => {
      group.claims.sort((a, b) => new Date(b.claim_date).getTime() - new Date(a.claim_date).getTime());
    });

    // Sort by month key descending
    return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [claims]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      rascunho: "bg-gray-500",
      submetido: "bg-blue-500",
      aprovado: "bg-green-500",
      pago: "bg-emerald-500",
      rejeitado: "bg-red-500",
    };

    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      submetido: "Submetido",
      aprovado: "Aprovado",
      pago: "Pago",
      rejeitado: "Rejeitado",
    };

    return (
      <Badge className={`${variants[status]} text-[10px] px-1.5 py-0`}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === "reembolso") return "Reembolso";
    if (type === "transferencia_bancaria") return "Transferência";
    if (type === "logbook") return "Logbook";
    if (type === "deslocacoes") return "Deslocações";
    return "Justificação Cartão";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const totalPending = claims
    ?.filter((c) => c.status === "submetido" || c.status === "aprovado")
    .reduce((sum, c) => sum + Number(c.total_amount), 0) || 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Minhas Requisições de Despesas</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Gerencie seus pedidos de reembolso e justificações
          </p>
        </div>
        {!isMobile && (
          <Button onClick={() => navigate("/expenses/new")} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Nova Requisição
          </Button>
        )}
      </div>

      {/* Total Pending Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Total Pendente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-bold text-primary">
            {formatCurrency(totalPending)}
          </p>
        </CardContent>
      </Card>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base md:text-lg">Requisições</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="submetido">Submetido</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : !claims || claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma requisição encontrada</p>
              <Button
                onClick={() => navigate("/expenses/new")}
                className="mt-4"
                variant="outline"
              >
                Criar primeira requisição
              </Button>
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="space-y-3">
              {claims.map((claim) => (
                <ExpenseCard key={claim.id} claim={claim} requesterName={claim.expense_users?.name} />
              ))}
            </div>
          ) : (
            // Desktop Table View - Grouped by Month
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="py-2 px-3 text-xs font-medium w-8"></TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Nº</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Data</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Requisitante</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Tipo</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Descrição</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium text-right">Total</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium">Status</TableHead>
                    <TableHead className="py-2 px-3 text-xs font-medium text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedClaims.map((group) => {
                    const isExpanded = expandedMonths.has(group.monthKey);
                    return (
                      <>
                        {/* Month Header Row */}
                        <TableRow 
                          key={`month-${group.monthKey}`}
                          className="bg-muted/50 hover:bg-muted/60 cursor-pointer"
                          onClick={() => toggleMonth(group.monthKey)}
                        >
                          <TableCell className="py-2 px-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell colSpan={5} className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{group.label}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {group.claims.length}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right">
                            <span className="text-xs font-medium text-red-600">
                              {formatCurrency(group.total)}
                            </span>
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>

                        {/* Claim Rows */}
                        {isExpanded && group.claims.map((claim) => (
                          <TableRow key={claim.id} className="hover:bg-muted/20">
                            <TableCell className="py-1.5 px-3"></TableCell>
                            <TableCell className="py-1.5 px-3 text-xs font-medium">
                              #{claim.claim_number}
                            </TableCell>
                            <TableCell className="py-1.5 px-3 text-xs">
                              {formatDate(claim.claim_date)}
                            </TableCell>
                            <TableCell className="py-1.5 px-3 text-xs max-w-[120px] truncate">
                              {claim.expense_users?.name || "-"}
                            </TableCell>
                            <TableCell className="py-1.5 px-3">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {getTypeBadge(claim.claim_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-1.5 px-3 text-xs max-w-[200px] truncate">
                              {claim.description || "-"}
                            </TableCell>
                            <TableCell className="py-1.5 px-3 text-right text-xs font-medium">
                              {formatCurrency(Number(claim.total_amount))}
                            </TableCell>
                            <TableCell className="py-1.5 px-3">
                              {getStatusBadge(claim.status)}
                            </TableCell>
                            <TableCell className="py-1.5 px-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => navigate(`/expenses/${claim.id}`)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {claim.status === "rascunho" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => navigate(`/expenses/${claim.id}/edit`)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Floating Action Buttons */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => navigate("/expenses/new")}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
