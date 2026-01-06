import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

type Security = {
  id: string;
  name: string;
  ticker: string | null;
  isin: string | null;
  currency: string | null;
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  eps: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  fcf: number | null;
  fcf_yield: number | null;
  roe: number | null;
  operating_margin: number | null;
  revenue_growth: number | null;
  debt_to_equity: number | null;
  interest_coverage: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  created_at: string;
};

type StockPrice = {
  symbol: string;
  current_price: number;
  previous_close: number | null;
  change: number | null;
  change_percent: string | null;
  latest_trading_day: string;
  fetched_at: string;
};

type SecurityFormData = {
  name: string;
  ticker: string;
  isin: string;
  currency: string;
  sector: string;
  industry: string;
  market_cap: string;
  eps: string;
  pe_ratio: string;
  pb_ratio: string;
  fcf: string;
  fcf_yield: string;
  roe: string;
  operating_margin: string;
  revenue_growth: string;
  debt_to_equity: string;
  interest_coverage: string;
  dividend_yield: string;
  payout_ratio: string;
};

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "BTC", "USDT"];

const formatCurrency = (value: number, currency: string = "EUR") => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency === "BTC" || currency === "USDT" ? "USD" : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(value);
};

const emptyFormData: SecurityFormData = {
  name: "",
  ticker: "",
  isin: "",
  currency: "EUR",
  sector: "",
  industry: "",
  market_cap: "",
  eps: "",
  pe_ratio: "",
  pb_ratio: "",
  fcf: "",
  fcf_yield: "",
  roe: "",
  operating_margin: "",
  revenue_growth: "",
  debt_to_equity: "",
  interest_coverage: "",
  dividend_yield: "",
  payout_ratio: "",
};

const parseNumber = (val: string): number | null => {
  if (!val.trim()) return null;
  const parsed = parseFloat(val.replace(",", "."));
  return isNaN(parsed) ? null : parsed;
};

const formatNumberField = (val: number | null): string => {
  if (val === null || val === undefined) return "";
  return val.toString().replace(".", ",");
};

export default function SecuritiesTable() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState<Security | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SecurityFormData>(emptyFormData);

  // Fetch securities
  const { data: securities = [], isLoading: loadingSecurities } = useQuery({
    queryKey: ["securities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("securities")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Security[];
    },
  });

  // Fetch stock prices for all symbols
  const { data: stockPrices = [], isLoading: loadingPrices, dataUpdatedAt } = useQuery({
    queryKey: ["stock-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_prices")
        .select("*")
        .order("symbol");
      if (error) throw error;
      return data as StockPrice[];
    },
    refetchInterval: 60000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SecurityFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("securities").insert({
        name: data.name.trim(),
        ticker: data.ticker.trim() || null,
        isin: data.isin.trim() || null,
        currency: data.currency,
        sector: data.sector.trim() || null,
        industry: data.industry.trim() || null,
        market_cap: parseNumber(data.market_cap),
        eps: parseNumber(data.eps),
        pe_ratio: parseNumber(data.pe_ratio),
        pb_ratio: parseNumber(data.pb_ratio),
        fcf: parseNumber(data.fcf),
        fcf_yield: parseNumber(data.fcf_yield),
        roe: parseNumber(data.roe),
        operating_margin: parseNumber(data.operating_margin),
        revenue_growth: parseNumber(data.revenue_growth),
        debt_to_equity: parseNumber(data.debt_to_equity),
        interest_coverage: parseNumber(data.interest_coverage),
        dividend_yield: parseNumber(data.dividend_yield),
        payout_ratio: parseNumber(data.payout_ratio),
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securities-list"] });
      toast.success("Título criado com sucesso");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar título: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SecurityFormData }) => {
      const { error } = await supabase
        .from("securities")
        .update({
          name: data.name.trim(),
          ticker: data.ticker.trim() || null,
          isin: data.isin.trim() || null,
          currency: data.currency,
          sector: data.sector.trim() || null,
          industry: data.industry.trim() || null,
          market_cap: parseNumber(data.market_cap),
          eps: parseNumber(data.eps),
          pe_ratio: parseNumber(data.pe_ratio),
          pb_ratio: parseNumber(data.pb_ratio),
          fcf: parseNumber(data.fcf),
          fcf_yield: parseNumber(data.fcf_yield),
          roe: parseNumber(data.roe),
          operating_margin: parseNumber(data.operating_margin),
          revenue_growth: parseNumber(data.revenue_growth),
          debt_to_equity: parseNumber(data.debt_to_equity),
          interest_coverage: parseNumber(data.interest_coverage),
          dividend_yield: parseNumber(data.dividend_yield),
          payout_ratio: parseNumber(data.payout_ratio),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securities-list"] });
      toast.success("Título atualizado com sucesso");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar título: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("securities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securities-list"] });
      toast.success("Título eliminado com sucesso");
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao eliminar título: ${error.message}`);
    },
  });

  const handleOpenCreate = () => {
    setEditingSecurity(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (security: Security) => {
    setEditingSecurity(security);
    setFormData({
      name: security.name,
      ticker: security.ticker || "",
      isin: security.isin || "",
      currency: security.currency || "EUR",
      sector: security.sector || "",
      industry: security.industry || "",
      market_cap: formatNumberField(security.market_cap),
      eps: formatNumberField(security.eps),
      pe_ratio: formatNumberField(security.pe_ratio),
      pb_ratio: formatNumberField(security.pb_ratio),
      fcf: formatNumberField(security.fcf),
      fcf_yield: formatNumberField(security.fcf_yield),
      roe: formatNumberField(security.roe),
      operating_margin: formatNumberField(security.operating_margin),
      revenue_growth: formatNumberField(security.revenue_growth),
      debt_to_equity: formatNumberField(security.debt_to_equity),
      interest_coverage: formatNumberField(security.interest_coverage),
      dividend_yield: formatNumberField(security.dividend_yield),
      payout_ratio: formatNumberField(security.payout_ratio),
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSecurity(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    if (editingSecurity) {
      updateMutation.mutate({ id: editingSecurity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Create a map of ticker -> price data
  const priceMap = stockPrices.reduce((acc, price) => {
    acc[price.symbol] = price;
    return acc;
  }, {} as Record<string, StockPrice>);

  // Merge securities with their prices
  const securitiesWithPrices = securities.map((sec) => {
    const price = sec.ticker ? priceMap[sec.ticker] : null;
    return { ...sec, price };
  });

  // Also show FX rates (EUR* symbols)
  const fxRates = stockPrices.filter((p) => p.symbol.startsWith("EUR"));

  const isLoading = loadingSecurities || loadingPrices;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* FX Rates Section */}
      {fxRates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Taxas de Câmbio</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {fxRates.map((fx) => {
              const currency = fx.symbol.replace("EUR", "");
              const changeNum = parseFloat(fx.change_percent?.replace("%", "") || "0");
              return (
                <div key={fx.symbol} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{currency}</span>
                    <Badge variant="outline" className="text-xs">FX</Badge>
                  </div>
                  <div className="text-lg font-bold">{fx.current_price.toFixed(4)}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {changeNum > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : changeNum < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={changeNum > 0 ? "text-green-500" : changeNum < 0 ? "text-red-500" : "text-muted-foreground"}>
                      {fx.change_percent || "0%"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Securities Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Títulos</h3>
          <div className="flex items-center gap-3">
            {dataUpdatedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Atualizado: {format(new Date(dataUpdatedAt), "HH:mm", { locale: pt })}
              </span>
            )}
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">P/E</TableHead>
                <TableHead className="text-right">ROE</TableHead>
                <TableHead className="text-right">D/Y</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Var.</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    A carregar...
                  </TableCell>
                </TableRow>
              ) : securitiesWithPrices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhum título registado
                  </TableCell>
                </TableRow>
              ) : (
                securitiesWithPrices.map((sec) => {
                  const changeNum = sec.price ? parseFloat(sec.price.change_percent?.replace("%", "") || "0") : 0;
                  return (
                    <TableRow key={sec.id}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={sec.name}>
                        {sec.name}
                      </TableCell>
                      <TableCell>
                        {sec.ticker ? (
                          <Badge variant="outline" className="text-xs">{sec.ticker}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate" title={sec.sector || ""}>
                        {sec.sector || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{sec.currency || "EUR"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {sec.pe_ratio ? sec.pe_ratio.toFixed(1) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {sec.roe ? `${sec.roe.toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {sec.dividend_yield ? `${sec.dividend_yield.toFixed(2)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {sec.price ? (
                          formatCurrency(sec.price.current_price, sec.currency || "EUR")
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {sec.price ? (
                          <div className="flex items-center justify-end gap-1">
                            {changeNum > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : changeNum < 0 ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : (
                              <Minus className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={changeNum > 0 ? "text-green-500" : changeNum < 0 ? "text-red-500" : "text-muted-foreground"}>
                              {sec.price.change_percent || "0%"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(sec)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(sec.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingSecurity ? "Editar Título" : "Novo Título"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="valuation">Valuation</TabsTrigger>
                <TabsTrigger value="quality">Qualidade</TabsTrigger>
                <TabsTrigger value="risk">Risco</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[400px] pr-4 mt-4">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Apple Inc."
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticker">Ticker</Label>
                      <Input
                        id="ticker"
                        value={formData.ticker}
                        onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                        placeholder="Ex: AAPL"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="isin">ISIN</Label>
                      <Input
                        id="isin"
                        value={formData.isin}
                        onChange={(e) => setFormData({ ...formData, isin: e.target.value.toUpperCase() })}
                        placeholder="Ex: US0378331005"
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Moeda</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sector">Setor</Label>
                      <Input
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Ex: Technology"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Indústria</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="Ex: Consumer Electronics"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market_cap">Market Cap</Label>
                    <Input
                      id="market_cap"
                      value={formData.market_cap}
                      onChange={(e) => setFormData({ ...formData, market_cap: e.target.value })}
                      placeholder="Ex: 3000000000000"
                    />
                    <p className="text-xs text-muted-foreground">Capitalização de mercado em moeda base</p>
                  </div>
                </TabsContent>

                <TabsContent value="valuation" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eps">EPS (Earnings per Share)</Label>
                      <Input
                        id="eps"
                        value={formData.eps}
                        onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                        placeholder="Ex: 6,42"
                      />
                      <p className="text-xs text-muted-foreground">Lucro por ação (TTM)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pe_ratio">P/E Ratio</Label>
                      <Input
                        id="pe_ratio"
                        value={formData.pe_ratio}
                        onChange={(e) => setFormData({ ...formData, pe_ratio: e.target.value })}
                        placeholder="Ex: 28,5"
                      />
                      <p className="text-xs text-muted-foreground">Preço/Lucro</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pb_ratio">P/B Ratio</Label>
                      <Input
                        id="pb_ratio"
                        value={formData.pb_ratio}
                        onChange={(e) => setFormData({ ...formData, pb_ratio: e.target.value })}
                        placeholder="Ex: 48,2"
                      />
                      <p className="text-xs text-muted-foreground">Preço/Valor contabilístico</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fcf">FCF (Free Cash Flow)</Label>
                      <Input
                        id="fcf"
                        value={formData.fcf}
                        onChange={(e) => setFormData({ ...formData, fcf: e.target.value })}
                        placeholder="Ex: 99584000000"
                      />
                      <p className="text-xs text-muted-foreground">Cash flow livre</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fcf_yield">FCF Yield (%)</Label>
                    <Input
                      id="fcf_yield"
                      value={formData.fcf_yield}
                      onChange={(e) => setFormData({ ...formData, fcf_yield: e.target.value })}
                      placeholder="Ex: 3,32"
                    />
                    <p className="text-xs text-muted-foreground">FCF / Market Cap</p>
                  </div>
                </TabsContent>

                <TabsContent value="quality" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roe">ROE (%)</Label>
                      <Input
                        id="roe"
                        value={formData.roe}
                        onChange={(e) => setFormData({ ...formData, roe: e.target.value })}
                        placeholder="Ex: 147,25"
                      />
                      <p className="text-xs text-muted-foreground">Return on Equity</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operating_margin">Margem Operacional (%)</Label>
                      <Input
                        id="operating_margin"
                        value={formData.operating_margin}
                        onChange={(e) => setFormData({ ...formData, operating_margin: e.target.value })}
                        placeholder="Ex: 29,8"
                      />
                      <p className="text-xs text-muted-foreground">Lucro operacional / Vendas</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revenue_growth">Crescimento de Receita (%)</Label>
                    <Input
                      id="revenue_growth"
                      value={formData.revenue_growth}
                      onChange={(e) => setFormData({ ...formData, revenue_growth: e.target.value })}
                      placeholder="Ex: 8,5"
                    />
                    <p className="text-xs text-muted-foreground">Taxa de crescimento 3-5 anos</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dividend_yield">Dividend Yield (%)</Label>
                      <Input
                        id="dividend_yield"
                        value={formData.dividend_yield}
                        onChange={(e) => setFormData({ ...formData, dividend_yield: e.target.value })}
                        placeholder="Ex: 0,55"
                      />
                      <p className="text-xs text-muted-foreground">Rendimento em dividendos</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout_ratio">Payout Ratio (%)</Label>
                      <Input
                        id="payout_ratio"
                        value={formData.payout_ratio}
                        onChange={(e) => setFormData({ ...formData, payout_ratio: e.target.value })}
                        placeholder="Ex: 15,6"
                      />
                      <p className="text-xs text-muted-foreground">Dividendos / Lucro</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="risk" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="debt_to_equity">Debt-to-Equity (D/E)</Label>
                    <Input
                      id="debt_to_equity"
                      value={formData.debt_to_equity}
                      onChange={(e) => setFormData({ ...formData, debt_to_equity: e.target.value })}
                      placeholder="Ex: 1,87"
                    />
                    <p className="text-xs text-muted-foreground">Nível de alavancagem (Dívida / Capital Próprio)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_coverage">Interest Coverage</Label>
                    <Input
                      id="interest_coverage"
                      value={formData.interest_coverage}
                      onChange={(e) => setFormData({ ...formData, interest_coverage: e.target.value })}
                      placeholder="Ex: 29,5"
                    />
                    <p className="text-xs text-muted-foreground">EBIT / Juros - capacidade de pagar juros</p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Título</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este título? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              {deleteMutation.isPending ? "A eliminar..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
