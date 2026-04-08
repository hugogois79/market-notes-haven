import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, FileText, ChevronRight, ChevronDown, Search, Download, TrendingUp, Clock, CheckCircle2, Ban, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Fetch ALL claims (filter client-side for search support)
  const { data: allClaims, isLoading } = useQuery({
    queryKey: ["expense-claims-with-requester"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_claims')
        .select(`
          *,
          expense_users (
            id,
            name
          )
        `)
        .order('claim_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Client-side filtering for status + search
  const claims = useMemo(() => {
    if (!allClaims) return [];
    return allClaims.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        return (
          c.description?.toLowerCase().includes(sq) ||
          c.expense_users?.name?.toLowerCase().includes(sq) ||
          String(c.claim_number).includes(sq) ||
          String(c.total_amount).includes(sq)
        );
      }
      return true;
    });
  }, [allClaims, statusFilter, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!claims || claims.length === 0) { toast.error("Sem dados para exportar"); return; }
    const headers = ["Nº", "Data", "Requisitante", "Tipo", "Descrição", "Total", "Status"];
    const rows = claims.map(c => [
      c.claim_number,
      new Date(c.claim_date).toLocaleDateString("pt-PT"),
      c.expense_users?.name || "",
      c.claim_type,
      (c.description || "").replace(/,/g, ";"),
      Number(c.total_amount).toFixed(2),
      c.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `despesas_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

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

      {/* KPI Dashboard */}
      {(() => {
        const all = allClaims || [];
        const byStatus = (s: string) => all.filter(c => c.status === s);
        const sumOf = (arr: any[]) => arr.reduce((s, c) => s + Number(c.total_amount), 0);
        const kpis = [
          { label: "Rascunho", status: "rascunho", value: sumOf(byStatus("rascunho")), count: byStatus("rascunho").length, color: "text-gray-500", icon: <FileText className="h-4 w-4" /> },
          { label: "Submetido", status: "submetido", value: sumOf(byStatus("submetido")), count: byStatus("submetido").length, color: "text-blue-500", icon: <Clock className="h-4 w-4" /> },
          { label: "Aprovado", status: "aprovado", value: sumOf(byStatus("aprovado")), count: byStatus("aprovado").length, color: "text-green-500", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Pago", status: "pago", value: sumOf(byStatus("pago")), count: byStatus("pago").length, color: "text-emerald-600", icon: <Wallet className="h-4 w-4" /> },
          { label: "Rejeitado", status: "rejeitado", value: sumOf(byStatus("rejeitado")), count: byStatus("rejeitado").length, color: "text-red-500", icon: <Ban className="h-4 w-4" /> },
        ];
        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {kpis.map(k => (
              <Card
                key={k.status}
                className={`cursor-pointer transition-all ${statusFilter === k.status ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                onClick={() => setStatusFilter(statusFilter === k.status ? "all" : k.status)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${k.color}`}>{k.label}</span>
                    <span className={k.color}>{k.icon}</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(k.value)}</p>
                  <p className="text-[10px] text-muted-foreground">{k.count} requisição{k.count !== 1 ? 'ões' : ''}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base md:text-lg">
              Requisições
              {claims && claims.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({claims.length} resultado{claims.length !== 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[180px] h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
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
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExportCSV}>
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
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
