import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Edit2, Search, TrendingDown, TrendingUp, Users, Building2, Info, Printer } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import TransactionDialog from "./TransactionDialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Company {
  id: string;
  name: string;
}

interface EntityManagementProps {
  companyId: string;
  companies?: Company[];
  onCompanyChange?: (companyId: string) => void;
}

interface Transaction {
  id: string;
  entity_name: string;
  type: "income" | "expense" | "notification" | "receipt";
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

interface CrossCompanyResult {
  entityName: string;
  companyId: string;
}

export default function EntityManagement({ companyId, companies, onCompanyChange }: EntityManagementProps) {
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter entities based on search term
  const filteredEntityGroups = useMemo(() => {
    if (!searchTerm.trim()) return entityGroups;
    return entityGroups.filter((group) =>
      group.entityName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entityGroups, searchTerm]);

  // Cross-company search when no local results
  const { data: crossCompanyResults } = useQuery({
    queryKey: ["cross-company-vendors", searchTerm, companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("entity_name, company_id")
        .ilike("entity_name", `%${searchTerm}%`)
        .neq("company_id", companyId);

      if (error) throw error;

      // Group by entity_name and company_id (deduplicate)
      const grouped = data.reduce<Record<string, CrossCompanyResult>>((acc, item) => {
        const key = `${item.entity_name}|${item.company_id}`;
        if (!acc[key]) {
          acc[key] = { entityName: item.entity_name, companyId: item.company_id };
        }
        return acc;
      }, {});

      return Object.values(grouped);
    },
    enabled: !!searchTerm.trim() && filteredEntityGroups.length === 0,
  });

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

  // Generate UK-style account statement HTML
  const generateStatementHtml = (group: EntityGroup, sortedTransactions: Transaction[], company?: Company) => {
    const today = format(new Date(), "dd MMMM yyyy");
    
    // Get date range from transactions
    const dates = sortedTransactions.map(tx => new Date(tx.date));
    const firstDate = dates.length > 0 ? format(Math.min(...dates.map(d => d.getTime())), "dd/MM/yyyy") : "—";
    const lastDate = dates.length > 0 ? format(Math.max(...dates.map(d => d.getTime())), "dd/MM/yyyy") : "—";
    
    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = sortedTransactions.map(tx => {
      if (tx.type === "income") {
        runningBalance += tx.total_amount;
      } else {
        runningBalance -= tx.total_amount;
      }
      return { ...tx, balance: runningBalance };
    });

    const formatValue = (value: number) => {
      return new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
      }).format(value);
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Account Statement - ${group.entityName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            color: #1e293b;
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
          }
          .header {
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .company-name {
            font-size: 22pt;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 4px;
          }
          .company-details {
            font-size: 9pt;
            color: #64748b;
          }
          .statement-title {
            font-size: 16pt;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #1e40af;
            margin-top: 20px;
            font-weight: 600;
          }
          .vendor-info {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 4px solid #1e40af;
          }
          .vendor-name {
            font-size: 14pt;
            font-weight: 600;
            color: #1e293b;
          }
          .period {
            font-size: 10pt;
            color: #64748b;
            margin-top: 4px;
          }
          .summary-box {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .summary-title {
            font-size: 11pt;
            font-weight: 600;
            color: #475569;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .summary-row:last-child {
            border-bottom: none;
          }
          .summary-row.total {
            border-top: 2px solid #1e40af;
            margin-top: 10px;
            padding-top: 12px;
            font-weight: 700;
            font-size: 12pt;
          }
          .summary-label {
            color: #64748b;
          }
          .summary-value {
            font-weight: 600;
            font-family: 'Consolas', monospace;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          thead th {
            background: #1e40af;
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          thead th.text-right {
            text-align: right;
          }
          tbody td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10pt;
          }
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          .text-right { text-align: right; }
          .negative { color: #dc2626; }
          .positive { color: #16a34a; }
          .balance-cell {
            font-family: 'Consolas', monospace;
            font-weight: 600;
          }
          .opening-row, .closing-row {
            background: #f1f5f9 !important;
            font-weight: 600;
          }
          .closing-row {
            border-top: 2px solid #1e40af;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 8pt;
          }
          .footer p {
            margin: 4px 0;
          }
          @media print {
            body { padding: 10mm; }
            .summary-box { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${company?.name || "Company"}</div>
          <div class="statement-title">Account Statement</div>
        </div>

        <div class="vendor-info">
          <div class="vendor-name">${group.entityName}</div>
          <div class="period">Statement Period: ${firstDate} to ${lastDate}</div>
        </div>

        <div class="summary-box">
          <div class="summary-title">Account Summary</div>
          <div class="summary-row">
            <span class="summary-label">Opening Balance</span>
            <span class="summary-value">€0.00</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Paid Out</span>
            <span class="summary-value negative">${formatValue(group.totalExpense)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Paid In</span>
            <span class="summary-value positive">${formatValue(group.totalIncome)}</span>
          </div>
          <div class="summary-row total">
            <span>Closing Balance</span>
            <span class="summary-value ${group.netAmount >= 0 ? "positive" : "negative"}">${formatValue(group.netAmount)}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Date</th>
              <th>Description</th>
              <th class="text-right" style="width: 100px;">Paid Out</th>
              <th class="text-right" style="width: 100px;">Paid In</th>
              <th class="text-right" style="width: 110px;">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr class="opening-row">
              <td></td>
              <td>Opening Balance</td>
              <td></td>
              <td></td>
              <td class="text-right balance-cell">€0.00</td>
            </tr>
            ${transactionsWithBalance.map(tx => `
              <tr>
                <td>${format(new Date(tx.date), "dd/MM/yy")}</td>
                <td>${tx.description}</td>
                <td class="text-right negative">${tx.type === "expense" ? formatValue(tx.total_amount) : ""}</td>
                <td class="text-right positive">${tx.type === "income" ? formatValue(tx.total_amount) : ""}</td>
                <td class="text-right balance-cell ${tx.balance >= 0 ? "positive" : "negative"}">${formatValue(tx.balance)}</td>
              </tr>
            `).join("")}
            <tr class="closing-row">
              <td></td>
              <td>Closing Balance</td>
              <td></td>
              <td></td>
              <td class="text-right balance-cell ${runningBalance >= 0 ? "positive" : "negative"}">${formatValue(runningBalance)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Page 1 of 1</p>
          <p>Statement generated on: ${today}</p>
          <p>This is a computer-generated document and requires no signature.</p>
        </div>
      </body>
      </html>
    `;
  };

  // Handle print statement
  const handlePrintStatement = (group: EntityGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const currentCompany = companies?.find(c => c.id === companyId);
    
    // Sort transactions by date (oldest first)
    const sortedTransactions = [...group.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const html = generateStatementHtml(group, sortedTransactions, currentCompany);
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => printWindow.print(), 250);
    };
  };

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Holdings
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntityGroups.map((group) => (
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
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => handlePrintStatement(group, e)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Imprimir extrato</TooltipContent>
                          </Tooltip>
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
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
              {filteredEntityGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "Nenhum vendor encontrado nesta empresa" : "Nenhum holding encontrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Cross-company results */}
          {filteredEntityGroups.length === 0 && searchTerm && crossCompanyResults && crossCompanyResults.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Vendor encontrado noutras empresas:
                </span>
              </div>
              <div className="space-y-2">
                {crossCompanyResults.map((result) => {
                  const company = companies?.find(c => c.id === result.companyId);
                  return (
                    <div key={`${result.entityName}-${result.companyId}`} className="flex items-center justify-between bg-white dark:bg-background/50 p-3 rounded-md border">
                      <span className="text-sm">
                        <strong>{result.entityName}</strong>
                        <span className="text-muted-foreground"> em </span>
                        {company?.name || "Empresa desconhecida"}
                      </span>
                      {onCompanyChange && company && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onCompanyChange(result.companyId)}
                        >
                          <Building2 className="h-4 w-4 mr-1" />
                          Mudar para {company.name}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
