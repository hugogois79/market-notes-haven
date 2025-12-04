import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Paperclip,
  Search,
  ArrowLeft,
  FileText,
  Check,
} from "lucide-react";

// Types
interface BillableItem {
  id: string;
  caseId: string;
  caseName: string;
  description: string;
  invoiceNumber: string;
  date: string;
  type: "fees" | "external_services" | "hours_worked";
  amount: number;
  paid: boolean;
  attachmentUrl?: string;
}

// Mock data
const mockBillableItems: BillableItem[] = [
  // Diana - Regulação Parental
  {
    id: "1",
    caseId: "case-1",
    caseName: "Diana - Regulação Parental",
    description: "Despesas Deslocação Ki Alves Pereira",
    invoiceNumber: "25",
    date: "2024-06-04",
    type: "external_services",
    amount: 1353.0,
    paid: true,
  },
  {
    id: "2",
    caseId: "case-1",
    caseName: "Diana - Regulação Parental",
    description: "Despesas Deslocação",
    invoiceNumber: "1353",
    date: "2024-06-05",
    type: "external_services",
    amount: 1353.0,
    paid: true,
  },
  {
    id: "3",
    caseId: "case-1",
    caseName: "Diana - Regulação Parental",
    description: "Sessões de Julgamento 2 Semestre 2024",
    invoiceNumber: "240107",
    date: "2024-11-08",
    type: "hours_worked",
    amount: 18450.0,
    paid: true,
  },
  {
    id: "4",
    caseId: "case-1",
    caseName: "Diana - Regulação Parental",
    description: "Honorarios Recurso Processo",
    invoiceNumber: "25001",
    date: "2025-01-07",
    type: "fees",
    amount: 14760.0,
    paid: true,
  },
  {
    id: "5",
    caseId: "case-1",
    caseName: "Diana - Regulação Parental",
    description: "Transcrições de Testemunhos",
    invoiceNumber: "30",
    date: "2025-01-16",
    type: "external_services",
    amount: 1085.5,
    paid: true,
  },
  {
    id: "6",
    caseId: "case-1",
    caseName: "Diana - Regulação Parental",
    description: "Taxa de Justiça",
    invoiceNumber: "31",
    date: "2025-01-28",
    type: "fees",
    amount: 122.4,
    paid: true,
  },
  {
    id: "7",
    caseId: "case-1",
    caseName: "Diana - Regulação Parental",
    description: "Taxas de Justiça",
    invoiceNumber: "32",
    date: "2025-02-28",
    type: "fees",
    amount: 306.0,
    paid: true,
  },

  // Vilacellos vs Splendidoption
  {
    id: "8",
    caseId: "case-2",
    caseName: "Vilacellos vs Splendidoption",
    description: "Instituto de Arbitragem - Custas",
    invoiceNumber: "11012025",
    date: "2025-01-11",
    type: "fees",
    amount: 2167.8,
    paid: true,
  },

  // Violência Doméstica
  {
    id: "9",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorarios",
    invoiceNumber: "36",
    date: "2021-05-04",
    type: "fees",
    amount: 4305.0,
    paid: true,
  },
  {
    id: "10",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorarios 2 Semestre 2024",
    invoiceNumber: "900174943",
    date: "2024-06-28",
    type: "fees",
    amount: 16186.6,
    paid: false,
  },
  {
    id: "11",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorario 1º Trimestre 2021",
    invoiceNumber: "1100000498",
    date: "2021-05-04",
    type: "fees",
    amount: 4305.0,
    paid: true,
  },
  {
    id: "12",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorários 2 Trimestre 2021",
    invoiceNumber: "900102912",
    date: "2021-06-24",
    type: "fees",
    amount: 6526.4,
    paid: true,
  },
  {
    id: "13",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorários 1º Trimestre 2022",
    invoiceNumber: "900111474",
    date: "2021-12-10",
    type: "fees",
    amount: 7792.4,
    paid: true,
  },
  {
    id: "14",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorario 2 Trimestre 2022",
    invoiceNumber: "900123039",
    date: "2022-07-12",
    type: "fees",
    amount: 6278.9,
    paid: true,
  },
  {
    id: "15",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorários 4 Trimestre 2022",
    invoiceNumber: "900130448",
    date: "2022-11-30",
    type: "fees",
    amount: 7786.1,
    paid: true,
  },
  {
    id: "16",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorários 1º Trimestre 2023",
    invoiceNumber: "900136582",
    date: "2023-03-24",
    type: "fees",
    amount: 18905.0,
    paid: true,
  },
  {
    id: "17",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorários 2º Trimeste 2023",
    invoiceNumber: "900142988",
    date: "2023-07-25",
    type: "fees",
    amount: 28792.2,
    paid: true,
  },
  {
    id: "18",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorario 4º Trimestre 2023",
    invoiceNumber: "900151807",
    date: "2023-12-19",
    type: "fees",
    amount: 29882.8,
    paid: true,
  },
  {
    id: "19",
    caseId: "case-3",
    caseName: "Violência Doméstica",
    description: "Honorários 1 Trimestre 2024",
    invoiceNumber: "900164180",
    date: "2024-06-28",
    type: "fees",
    amount: 33187.8,
    paid: true,
  },
];

const typeColors: Record<string, string> = {
  fees: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  external_services: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  hours_worked: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const typeLabels: Record<string, string> = {
  fees: "Honorários",
  external_services: "Serviços Externos",
  hours_worked: "Horas Trabalhadas",
};

export default function LegalBillableItemsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [paidFilter, setPaidFilter] = useState<string>("all");
  const [openCases, setOpenCases] = useState<Record<string, boolean>>({});

  const toggleCase = (caseId: string) => {
    setOpenCases((prev) => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return mockBillableItems.filter((item) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !item.description.toLowerCase().includes(search) &&
          !item.invoiceNumber.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (paidFilter === "paid" && !item.paid) return false;
      if (paidFilter === "unpaid" && item.paid) return false;
      return true;
    });
  }, [searchTerm, paidFilter]);

  // Group by case
  const groupedByCases = useMemo(() => {
    const grouped: Record<string, { caseName: string; items: BillableItem[]; total: number }> = {};

    filteredItems.forEach((item) => {
      if (!grouped[item.caseId]) {
        grouped[item.caseId] = {
          caseName: item.caseName,
          items: [],
          total: 0,
        };
      }
      grouped[item.caseId].items.push(item);
      grouped[item.caseId].total += item.amount;
    });

    return grouped;
  }, [filteredItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT");
  };

  const grandTotal = useMemo(() => {
    return Object.values(groupedByCases).reduce((sum, group) => sum + group.total, 0);
  }, [groupedByCases]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/legal">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-foreground">Financeiro</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Gestão de Itens Faturáveis por Caso
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por descrição ou fatura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={paidFilter} onValueChange={setPaidFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="unpaid">Não Pagos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grand Total */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Total Geral ({Object.keys(groupedByCases).length} casos)
        </span>
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(grandTotal)}
        </span>
      </div>

      {/* Grouped Accordion List */}
      <div className="space-y-3">
        {Object.entries(groupedByCases).map(([caseId, { caseName, items, total }]) => {
          const isOpen = openCases[caseId];

          return (
            <Collapsible
              key={caseId}
              open={isOpen}
              onOpenChange={() => toggleCase(caseId)}
            >
              {/* Case Header / Separator */}
              <div className="border rounded-lg bg-card overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground text-lg">
                        {caseName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {items.length} itens
                      </Badge>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-muted text-foreground font-bold text-base px-4 py-1"
                    >
                      {formatCurrency(total)}
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <div className="border-t">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-[30%]">Descrição</TableHead>
                          <TableHead className="w-[12%]">Fatura #</TableHead>
                          <TableHead className="w-[12%]">Data</TableHead>
                          <TableHead className="w-[15%]">Tipo</TableHead>
                          <TableHead className="w-[15%] text-right">Valor</TableHead>
                          <TableHead className="w-[8%] text-center">Pago</TableHead>
                          <TableHead className="w-[8%] text-center">
                            <Paperclip className="w-4 h-4 inline-block" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-accent/30 cursor-pointer"
                          >
                            <TableCell className="font-medium">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.invoiceNumber}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(item.date)}
                            </TableCell>
                            <TableCell>
                              <Badge className={typeColors[item.type]}>
                                {typeLabels[item.type]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.paid ? (
                                <Check className="w-5 h-5 text-green-600 inline-block" />
                              ) : (
                                <Checkbox disabled />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.attachmentUrl ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Paperclip className="w-4 h-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {Object.keys(groupedByCases).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum item encontrado.
        </div>
      )}
    </div>
  );
}
