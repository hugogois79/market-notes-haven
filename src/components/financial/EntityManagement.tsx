import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit2, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import TransactionDialog from "./TransactionDialog";

interface EntityManagementProps {
  companyId: string;
}

interface Transaction {
  id: string;
  entity_name: string;
  type: "income" | "expense";
  total_amount: number;
  date: string;
  description: string;
  category: string;
}

interface EntityGroup {
  entityName: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  transactions: Transaction[];
  type: "supplier" | "client" | "mixed";
}

export default function EntityManagement({ companyId }: EntityManagementProps) {
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["entity-transactions", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleEditTransaction = (tx: any) => {
    setEditingTransaction(tx);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const entityGroups = useMemo(() => {
    if (!transactions) return [];

    const groupMap = new Map<string, EntityGroup>();

    transactions.forEach((tx) => {
      const existing = groupMap.get(tx.entity_name);
      
      if (existing) {
        existing.transactions.push(tx);
        existing.transactionCount++;
        if (tx.type === "income") {
          existing.totalIncome += tx.total_amount;
        } else {
          existing.totalExpense += tx.total_amount;
        }
        existing.netAmount = existing.totalIncome - existing.totalExpense;
        
        // Update type based on transactions
        if (existing.totalIncome > 0 && existing.totalExpense > 0) {
          existing.type = "mixed";
        } else if (existing.totalIncome > 0) {
          existing.type = "client";
        } else {
          existing.type = "supplier";
        }
      } else {
        const isIncome = tx.type === "income";
        groupMap.set(tx.entity_name, {
          entityName: tx.entity_name,
          totalIncome: isIncome ? tx.total_amount : 0,
          totalExpense: isIncome ? 0 : tx.total_amount,
          netAmount: isIncome ? tx.total_amount : -tx.total_amount,
          transactionCount: 1,
          transactions: [tx],
          type: isIncome ? "client" : "supplier",
        });
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => 
      Math.abs(b.netAmount) - Math.abs(a.netAmount)
    );
  }, [transactions]);

  const toggleEntity = (entityName: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityName)) {
        next.delete(entityName);
      } else {
        next.add(entityName);
      }
      return next;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const getTypeColor = (type: EntityGroup["type"]) => {
    switch (type) {
      case "client":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "supplier":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "mixed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const getTypeLabel = (type: EntityGroup["type"]) => {
    switch (type) {
      case "client":
        return "Cliente";
      case "supplier":
        return "Fornecedor";
      case "mixed":
        return "Misto";
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    return entityGroups.reduce(
      (acc, group) => ({
        totalClients: acc.totalClients + (group.type === "client" ? 1 : 0),
        totalSuppliers: acc.totalSuppliers + (group.type === "supplier" ? 1 : 0),
        totalMixed: acc.totalMixed + (group.type === "mixed" ? 1 : 0),
        totalIncome: acc.totalIncome + group.totalIncome,
        totalExpense: acc.totalExpense + group.totalExpense,
      }),
      { totalClients: 0, totalSuppliers: 0, totalMixed: 0, totalIncome: 0, totalExpense: 0 }
    );
  }, [entityGroups]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{entityGroups.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600">{totals.totalClients}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{totals.totalSuppliers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalIncome + totals.totalExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Holding</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Transações</TableHead>
                <TableHead className="text-right text-emerald-600">Receitas</TableHead>
                <TableHead className="text-right text-red-600">Despesas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entityGroups.map((group) => (
                <Collapsible
                  key={group.entityName}
                  open={expandedEntities.has(group.entityName)}
                  onOpenChange={() => toggleEntity(group.entityName)}
                  asChild
                >
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          {expandedEntities.has(group.entityName) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{group.entityName}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(group.type)} variant="secondary">
                            {getTypeLabel(group.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{group.transactionCount}</TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {group.totalIncome > 0 ? formatCurrency(group.totalIncome) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {group.totalExpense > 0 ? formatCurrency(group.totalExpense) : "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            group.netAmount >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(group.netAmount)}
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <>
                        {group.transactions.map((tx) => (
                          <TableRow 
                            key={tx.id} 
                            className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleEditTransaction(tx)}
                          >
                            <TableCell>
                              <Edit2 className="h-3 w-3 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm pl-8">
                              {format(new Date(tx.date), "dd MMM yyyy", { locale: pt })}
                            </TableCell>
                            <TableCell className="text-sm">{tx.description}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {tx.category}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {tx.type === "income" ? (
                                <span className="text-emerald-600">{formatCurrency(tx.total_amount)}</span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {tx.type === "expense" ? (
                                <span className="text-red-600">{formatCurrency(tx.total_amount)}</span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
              {entityGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum holding encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Edit Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        companyId={companyId}
        transaction={editingTransaction}
      />
    </div>
  );
}
