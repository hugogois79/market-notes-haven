import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, FileText, Settings } from "lucide-react";
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
import { expenseClaimService } from "@/services/expenseClaimService";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
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
  const isMobile = useIsMobile();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["expense-claims", statusFilter],
    queryFn: () =>
      expenseClaimService.getExpenseClaims(
        statusFilter === "all" ? undefined : statusFilter
      ),
  });

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
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "reembolso" ? "Reembolso" : "Justificação Cartão";
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
          <div className="flex gap-2">
            <Button onClick={() => navigate("/expenses/settings")} variant="outline" size="lg">
              <Settings className="mr-2 h-4 w-4" />
              Definições
            </Button>
            <Button onClick={() => navigate("/expenses/new")} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Nova Requisição
            </Button>
          </div>
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
                <ExpenseCard key={claim.id} claim={claim} />
              ))}
            </div>
          ) : (
            // Desktop Table View
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">
                      #{claim.claim_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(claim.claim_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{getTypeBadge(claim.claim_type)}</TableCell>
                    <TableCell>{claim.description || "-"}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(claim.total_amount))}
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/expenses/${claim.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {claim.status === "rascunho" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/expenses/${claim.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mobile Floating Action Buttons */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          <Button
            onClick={() => navigate("/expenses/settings")}
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-background"
          >
            <Settings className="h-5 w-5" />
          </Button>
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
