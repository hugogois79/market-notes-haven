import { useState, useMemo } from "react";
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
import { Edit, Trash2, ArrowUp, ArrowDown, Paperclip, ChevronRight, ChevronDown } from "lucide-react";

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
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

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

  const groupedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const groups: Record<string, { monthKey: string; label: string; transactions: any[]; total: number }> = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
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
          transactions: [],
          total: 0,
        };
      }

      groups[monthKey].transactions.push(transaction);
      groups[monthKey].total += transaction.type === "income" 
        ? Number(transaction.total_amount) 
        : -Number(transaction.total_amount);
    });

    // Sort by month key descending (most recent first)
    return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [transactions]);

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
            <TableHead className="py-2 px-3 text-xs font-medium w-8"></TableHead>
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
          {groupedTransactions.map((group) => {
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
                        {group.transactions.length}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <span className={`text-xs font-medium ${group.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(group.total)}
                    </span>
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>

                {/* Transaction Rows */}
                {isExpanded && group.transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/20">
                    <TableCell className="py-1.5 px-3"></TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const response = await fetch(transaction.invoice_file_url);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              const filename = transaction.invoice_file_url.split('/').pop() || 'anexo';
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Error downloading file:', error);
                              window.open(transaction.invoice_file_url, '_blank');
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
                            onEdit(transaction);
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
                            onDelete(transaction.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
  );
}
