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

export default function SecuritiesTable() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState<Security | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SecurityFormData>({
    name: "",
    ticker: "",
    isin: "",
    currency: "EUR",
  });

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
    setFormData({ name: "", ticker: "", isin: "", currency: "EUR" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (security: Security) => {
    setEditingSecurity(security);
    setFormData({
      name: security.name,
      ticker: security.ticker || "",
      isin: security.isin || "",
      currency: security.currency || "EUR",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSecurity(null);
    setFormData({ name: "", ticker: "", isin: "", currency: "EUR" });
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
                <TableHead>ISIN</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">Última Atualização</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    A carregar...
                  </TableCell>
                </TableRow>
              ) : securitiesWithPrices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum título registado
                  </TableCell>
                </TableRow>
              ) : (
                securitiesWithPrices.map((sec) => {
                  const changeNum = sec.price ? parseFloat(sec.price.change_percent?.replace("%", "") || "0") : 0;
                  return (
                    <TableRow key={sec.id}>
                      <TableCell className="font-medium">{sec.name}</TableCell>
                      <TableCell>
                        {sec.ticker ? (
                          <Badge variant="outline">{sec.ticker}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {sec.isin || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sec.currency || "EUR"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {sec.price ? (
                          formatCurrency(sec.price.current_price, sec.currency || "EUR")
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {sec.price ? (
                          <div className="flex items-center justify-end gap-1">
                            {changeNum > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : changeNum < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={changeNum > 0 ? "text-green-500" : changeNum < 0 ? "text-red-500" : "text-muted-foreground"}>
                              {sec.price.change_percent || "0%"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {sec.price ? (
                          format(new Date(sec.price.fetched_at), "dd/MM/yyyy HH:mm", { locale: pt })
                        ) : (
                          "—"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSecurity ? "Editar Título" : "Novo Título"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <DialogFooter>
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
