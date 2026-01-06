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

  // Calculate totals
  const totalValue = cashAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  // Set default active account when data loads
  const effectiveActiveAccount = activeAccountId || (cashAssets.length > 0 ? cashAssets[0].id : null);

  const renderHoldingsTable = (asset: CashAsset) => {
    const accountWeight = totalValue > 0 ? ((asset.current_value || 0) / totalValue) * 100 : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Valor: <span className="font-semibold text-foreground">{formatCurrency(asset.current_value)}</span>
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
                <TableHead className="text-right">Custo Base</TableHead>
                <TableHead className="text-right">P/L</TableHead>
                <TableHead className="text-right">Weight %</TableHead>
                <TableHead className="text-right">Target %</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asset.holdings.map((holding) => {
                const pl = (holding.current_value || 0) - (holding.cost_basis || 0);
                const plPercent = holding.cost_basis && holding.cost_basis !== 0 ? (pl / Math.abs(holding.cost_basis)) * 100 : 0;

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
                        {holding.currency || "EUR"}
                      </Badge>
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
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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
              const accountWeight = totalValue > 0 ? ((asset.current_value || 0) / totalValue) * 100 : 0;
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
