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
import { Edit, Trash2, ArrowUp, ArrowDown, Paperclip } from "lucide-react";

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
    return <div className="text-center py-4 text-sm">A carregar...</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Nenhum movimento registado
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT");
  };

  const getCategoryLabel = (transaction: any) => {
    if (transaction.category_name) {
      return transaction.category_name;
    }
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="py-2 px-3 text-xs font-medium">Data</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium">Tipo</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium">Descrição</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium">Entidade</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium">Categoria</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium text-right">Valor</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium">Projeto</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium text-center">Anexo</TableHead>
            <TableHead className="py-2 px-3 text-xs font-medium text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} className="hover:bg-muted/20">
              <TableCell className="py-1.5 px-3 text-xs">{formatDate(transaction.date)}</TableCell>
              <TableCell className="py-1.5 px-3">
                <Badge
                  variant={transaction.type === "income" ? "default" : "destructive"}
                  className="gap-0.5 text-[10px] px-1.5 py-0"
                >
                  {transaction.type === "income" ? (
                    <>
                      <ArrowUp className="h-2.5 w-2.5" />
                      Receita
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-2.5 w-2.5" />
                      Despesa
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="py-1.5 px-3 text-xs font-medium max-w-[150px] truncate">
                {transaction.description}
              </TableCell>
              <TableCell className="py-1.5 px-3 text-xs max-w-[120px] truncate">
                {transaction.entity_name}
              </TableCell>
              <TableCell className="py-1.5 px-3">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {getCategoryLabel(transaction)}
                </Badge>
              </TableCell>
              <TableCell className="py-1.5 px-3 text-right text-xs font-medium">
                <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(Number(transaction.total_amount))}
                </span>
              </TableCell>
              <TableCell className="py-1.5 px-3">
                {transaction.project_name && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {transaction.project_name}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="py-1.5 px-3 text-center">
                {transaction.invoice_file_url && (
                  <a
                    href={transaction.invoice_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center text-muted-foreground hover:text-primary"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </a>
                )}
              </TableCell>
              <TableCell className="py-1.5 px-3 text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <Trash2 className="h-3 w-3" />
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
