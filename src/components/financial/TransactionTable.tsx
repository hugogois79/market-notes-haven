import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface TransactionTableProps {
  transactions: any[];
  isLoading: boolean;
  onEdit: (transaction: any) => void;
  onDelete: (id: string) => void;
}

export default function TransactionTable({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  if (isLoading) {
    return <div className="text-center py-8">A carregar...</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum movimento registado
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const getCategoryLabel = (transaction: any) => {
    // Prefer category from expense_categories relation
    if (transaction.expense_categories?.name) {
      return transaction.expense_categories.name;
    }
    // Fallback to old category enum
    const labels: Record<string, string> = {
      sales: "Vendas",
      materials: "Materiais",
      salaries: "Salários",
      services: "Serviços",
      taxes: "Impostos",
      utilities: "Utilidades",
      other: "Outro",
    };
    return labels[transaction.category] || transaction.category;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Entidade</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.date)}</TableCell>
              <TableCell>
                <Badge
                  variant={transaction.type === "income" ? "default" : "destructive"}
                  className="gap-1"
                >
                  {transaction.type === "income" ? (
                    <>
                      <ArrowUp className="h-3 w-3" />
                      Receita
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3 w-3" />
                      Despesa
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{transaction.description}</TableCell>
              <TableCell>{transaction.entity_name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getCategoryLabel(transaction)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(Number(transaction.total_amount))}
                </span>
              </TableCell>
              <TableCell>
                {transaction.expense_projects?.name && (
                  <Badge variant="secondary">
                    {transaction.expense_projects.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
