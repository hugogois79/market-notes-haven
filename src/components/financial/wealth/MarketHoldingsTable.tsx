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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

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

  const handleEdit = (holding: MarketHolding) => {
    setSelectedHolding(holding);
    setSelectedAssetId(holding.asset_id);
    setDialogOpen(true);
  };

  const handleAddHolding = (assetId: string) => {
    setSelectedHolding(null);
    setSelectedAssetId(assetId);
    setDialogOpen(true);
  };

  const toggleExpand = (assetId: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  // Group assets by subcategory
  const subcategories = Array.from(
    new Set(cashAssets.map((a) => a.subcategory || "Geral"))
  ).sort();

  const assetsBySubcategory = subcategories.reduce((acc, sub) => {
    acc[sub] = cashAssets.filter((a) => (a.subcategory || "Geral") === sub);
    return acc;
  }, {} as Record<string, CashAsset[]>);

  // Calculate totals
  const totalValue = cashAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  const renderAccountTable = (assets: CashAsset[]) => {
    const groupTotal = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Conta / Holding</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Custo Base</TableHead>
              <TableHead className="text-right">P/L</TableHead>
              <TableHead className="text-right">Weight %</TableHead>
              <TableHead className="text-right">Target %</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => {
              const isExpanded = expandedAccounts.has(asset.id);
              const accountWeight = totalValue > 0 ? ((asset.current_value || 0) / totalValue) * 100 : 0;

              return (
                <Collapsible key={asset.id} open={isExpanded} onOpenChange={() => toggleExpand(asset.id)} asChild>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow className="bg-muted/30 cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>{asset.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {asset.holdings.length} holdings
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(asset.current_value)}
                        </TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPercent(accountWeight)}
                        </TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddHolding(asset.id);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <>
                        {asset.holdings.map((holding) => {
                          const pl = (holding.current_value || 0) - (holding.cost_basis || 0);
                          const plPercent = holding.cost_basis && holding.cost_basis !== 0 ? (pl / Math.abs(holding.cost_basis)) * 100 : 0;

                          return (
                            <TableRow key={holding.id} className="bg-background">
                              <TableCell className="pl-12">
                                <span className="text-muted-foreground">{holding.name}</span>
                              </TableCell>
                              <TableCell>
                                {holding.ticker && (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {holding.ticker}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(holding.current_value)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {holding.cost_basis ? formatCurrency(holding.cost_basis) : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {holding.cost_basis ? (
                                  <>
                                    <span className={pl >= 0 ? "text-green-600" : "text-red-600"}>
                                      {formatCurrency(pl)}
                                    </span>
                                    <span className={`ml-1 text-xs ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      ({plPercent.toFixed(1)}%)
                                    </span>
                                  </>
                                ) : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {holding.weight_current ? formatPercent(holding.weight_current) : "—"}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {holding.weight_target ? formatPercent(holding.weight_target) : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(holding)}>
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
                            <TableCell colSpan={8} className="pl-12 text-muted-foreground text-sm">
                              Sem holdings. Clique em + para adicionar.
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contas de Mercado</h3>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalValue)} | {cashAssets.length} contas
          </p>
        </div>
      </div>

      {subcategories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma conta Cash encontrada. Adicione ativos com categoria "Cash" no Portfolio.
        </div>
      ) : subcategories.length === 1 ? (
        // If only one subcategory, don't show tabs
        renderAccountTable(cashAssets)
      ) : (
        // Show tabs for multiple subcategories
        <Tabs defaultValue={subcategories[0]} className="space-y-4">
          <TabsList>
            {subcategories.map((sub) => {
              const subAssets = assetsBySubcategory[sub];
              const subTotal = subAssets.reduce((s, a) => s + (a.current_value || 0), 0);
              return (
                <TabsTrigger key={sub} value={sub} className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {sub}
                  <Badge variant="secondary" className="ml-1">
                    {formatCurrency(subTotal)}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {subcategories.map((sub) => (
            <TabsContent key={sub} value={sub}>
              {renderAccountTable(assetsBySubcategory[sub])}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <MarketHoldingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        holding={selectedHolding}
        assetId={selectedAssetId}
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
