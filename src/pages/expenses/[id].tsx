import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

const ExpenseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: claim, isLoading: loadingClaim } = useQuery({
    queryKey: ["expense-claim", id],
    queryFn: () => expenseClaimService.getExpenseClaimById(id!),
    enabled: !!id,
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses", id],
    queryFn: () => expenseClaimService.getExpenses(id!),
    enabled: !!id,
  });

  const handleDownloadReceipt = async (url: string) => {
    try {
      const filePath = expenseClaimService.getFilePathFromUrl(url);
      if (!filePath) {
        toast({
          title: "Erro",
          description: "Não foi possível obter o caminho do ficheiro",
          variant: "destructive",
        });
        return;
      }

      const fileName = filePath.split('/').pop() || 'recibo.pdf';
      await expenseClaimService.downloadReceipt(filePath, fileName);
      
      toast({
        title: "Download iniciado",
        description: "O ficheiro está a ser transferido",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer download do ficheiro",
        variant: "destructive",
      });
    }
  };

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
    return type === "reembolso" ? "Reembolso de Despesas" : "Justificação de Cartão de Crédito";
  };

  if (loadingClaim || loadingExpenses) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Requisição não encontrada</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/expenses")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Requisição #{claim.claim_number}
          </h1>
          <p className="text-muted-foreground mt-1">
            Detalhes da requisição de despesas
          </p>
        </div>
        {claim.status === "rascunho" && (
          <Button onClick={() => navigate(`/expenses/${id}/edit`)}>
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getTypeBadge(claim.claim_type)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(claim.status)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Criação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {format(new Date(claim.created_at), "dd/MM/yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Submissão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {claim.submission_date
                ? format(new Date(claim.submission_date), "dd/MM/yyyy")
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {claim.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{claim.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {!expenses || expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma despesa adicionada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Comprovativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.supplier}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell>
                      {expense.receipt_image_url ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadReceipt(expense.receipt_image_url!)}
                          className="text-primary hover:underline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total:</span>
            <span className="text-primary">
              {formatCurrency(Number(claim.total_amount))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseDetailPage;
