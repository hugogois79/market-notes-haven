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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MarketHoldingDialog from "./MarketHoldingDialog";

type MarketHolding = {
  id: string;
  user_id: string;
  asset_id: string;
  name: string;
  ticker: string | null;
  isin: string | null;
  currency: string | null;
  weight_target: number | null;
  weight_current: number | null;
  current_value: number | null;
  cost_basis: number | null;
  quantity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CashAsset = {
  id: string;
  name: string;
  subcategory: string | null;
  current_value: number | null;
  holdings: MarketHolding[];
};

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}%`;
};

export default function MarketHoldingsTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<MarketHolding | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetName, setSelectedAssetName] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  // Fetch FX rates from stock_prices (symbols like EURUSD, EURGBP, etc.)
  const { data: fxRates = {} } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_prices")
        .select("symbol, current_price")
        .like("symbol", "EUR%");

      if (error) {
        console.error("FX rates fetch error:", error);
        return {};
      }

      // Create map: { "EURUSD": 1.085, "EURGBP": 0.835 }
      return (data || []).reduce((acc, row) => {
        acc[row.symbol] = row.current_price;
        return acc;
      }, {} as Record<string, number>);
    },
  });

  // Convert value to EUR using FX rate
  const convertToEUR = (value: number, currency: string): number => {
    if (!value || currency === "EUR") return value;
    const fxSymbol = `EUR${currency}`; // e.g., EURUSD
    const rate = fxRates[fxSymbol];
    // rate = how many USD per 1 EUR, so EUR = USD / rate
    return rate && rate > 0 ? value / rate : value;
  };

  // Fetch Cash category assets with holdings
  const { data: cashAssets = [], isLoading } = useQuery({
    queryKey: ["cash-assets-with-holdings"],
    queryFn: async () => {
      const { data: assets, error: assetsError } = await supabase
        .from("wealth_assets")
        .select("id, name, subcategory, current_value")
        .eq("category", "Cash")
        .order("name");

      if (assetsError) throw assetsError;

      // Fetch holdings separately (RLS will filter by user_id)
      const { data: holdings, error: holdingsError } = await supabase
        .from("market_holdings")
        .select("*")
        .order("name");

      if (holdingsError) {
        console.error("Holdings fetch error:", holdingsError);
      }

      // Group holdings by asset_id
      const holdingsByAsset = (holdings || []).reduce((acc, h) => {
        if (!acc[h.asset_id]) acc[h.asset_id] = [];
        acc[h.asset_id].push(h);
        return acc;
      }, {} as Record<string, MarketHolding[]>);

      return (assets || []).map((asset) => ({
        ...asset,
        holdings: holdingsByAsset[asset.id] || [],
      })) as CashAsset[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("market_holdings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-assets-with-holdings"] });
      toast.success("Holding eliminado");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao eliminar holding");
    },
  });

  const handleEdit = (holding: MarketHolding, accountName: string) => {
    setSelectedHolding(holding);
    setSelectedAssetId(holding.asset_id);
    setSelectedAssetName(accountName);
    setDialogOpen(true);
  };

  const handleAddHolding = (assetId: string, accountName: string) => {
    setSelectedHolding(null);
    setSelectedAssetId(assetId);
    setSelectedAssetName(accountName);
    setDialogOpen(true);
  };

  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  // Calculate totals based on holdings sum (converted to EUR)
  const getAccountHoldingsValueEUR = (asset: CashAsset) => {
    return asset.holdings.reduce((sum, h) => {
      const valueEUR = convertToEUR(h.current_value || 0, h.currency || "EUR");
      return sum + valueEUR;
    }, 0);
  };

  const totalValue = cashAssets.reduce((sum, a) => sum + getAccountHoldingsValueEUR(a), 0);

  // Set default active account when data loads
  const effectiveActiveAccount = activeAccountId || (cashAssets.length > 0 ? cashAssets[0].id : null);

  const renderHoldingsTable = (asset: CashAsset) => {
    const holdingsValueEUR = getAccountHoldingsValueEUR(asset);
    const accountWeight = totalValue > 0 ? (holdingsValueEUR / totalValue) * 100 : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Valor: <span className="font-semibold text-foreground">{formatCurrency(holdingsValueEUR)}</span>
              <span className="mx-2">|</span>
              Peso: <span className="font-medium">{formatPercent(accountWeight)}</span>
              <span className="mx-2">|</span>
              {asset.holdings.length} holdings
            </p>
          </div>
          <Button size="sm" onClick={() => handleAddHolding(asset.id, asset.name)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Holding
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Holding</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Valor EUR</TableHead>
                <TableHead className="text-right">P/L EUR</TableHead>
                <TableHead className="text-right">Weight %</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asset.holdings.map((holding) => {
                const currency = holding.currency || "EUR";
                const valueEUR = convertToEUR(holding.current_value || 0, currency);
                const costBasisEUR = convertToEUR(holding.cost_basis || 0, currency);
                const plEUR = valueEUR - costBasisEUR;
                const plPercent = costBasisEUR !== 0 ? (plEUR / Math.abs(costBasisEUR)) * 100 : 0;
                const holdingWeight = totalValue > 0 ? (valueEUR / totalValue) * 100 : 0;

                // Format original currency value
                const formatOriginalCurrency = (value: number | null, curr: string) => {
                  if (value === null || value === undefined) return "—";
                  return new Intl.NumberFormat("pt-PT", {
                    style: "currency",
                    currency: curr === "USDT" || curr === "BTC" ? "USD" : curr,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(value);
                };

                return (
                  <TableRow key={holding.id}>
                    <TableCell className="font-medium">{holding.name}</TableCell>
                    <TableCell>
                      {holding.ticker && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {holding.ticker}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {currency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {currency !== "EUR" ? (
                        <span className="text-muted-foreground">
                          {formatOriginalCurrency(holding.current_value, currency)}
                        </span>
                      ) : (
                        formatCurrency(holding.current_value)
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(valueEUR)}
                    </TableCell>
                    <TableCell className="text-right">
                      {holding.cost_basis ? (
                        <>
                          <span className={plEUR >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(plEUR)}
                          </span>
                          <span className={`ml-1 text-xs ${plEUR >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ({plPercent.toFixed(1)}%)
                          </span>
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(holdingWeight)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(holding, asset.name)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteId(holding.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {asset.holdings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Sem holdings nesta conta. Clique em "Adicionar Holding" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  const activeAsset = cashAssets.find(a => a.id === effectiveActiveAccount);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Contas de Mercado</h3>
        <p className="text-sm text-muted-foreground">
          Total: {formatCurrency(totalValue)} | {cashAssets.length} contas
        </p>
      </div>

      {cashAssets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma conta Cash encontrada. Adicione ativos com categoria "Cash" no Portfolio.
        </div>
      ) : (
        <Tabs value={effectiveActiveAccount || undefined} onValueChange={setActiveAccountId} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {cashAssets.map((asset) => {
              const holdingsValue = getAccountHoldingsValueEUR(asset);
              return (
                <TabsTrigger key={asset.id} value={asset.id} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {asset.name}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {asset.holdings.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {cashAssets.map((asset) => (
            <TabsContent key={asset.id} value={asset.id}>
              {renderHoldingsTable(asset)}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <MarketHoldingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        holding={selectedHolding}
        assetId={selectedAssetId}
        accountName={selectedAssetName}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Holding?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
