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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2, Car, Anchor, Palette, Watch, Coins, TrendingUp, TrendingDown, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import WealthAssetDialog from "./WealthAssetDialog";
import WealthAssetNotesDialog from "./WealthAssetNotesDialog";

type WealthAsset = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  status: string | null;
  current_value: number | null;
  purchase_price: number | null;
  purchase_date: string | null;
  profit_loss_value: number | null;
  yield_expected: number | null;
  allocation_weight: number | null;
  target_value_6m: number | null;
  target_weight: number | null;
  vintage_year: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
};

const categoryIcons: Record<string, React.ElementType> = {
  "Real Estate Fund": Building2,
  "Properties": Building2,
  "Vehicles": Car,
  "Marine": Anchor,
  "Art": Palette,
  "Watches": Watch,
  "Crypto": Coins,
};

const categoryColors: Record<string, string> = {
  "Real Estate Fund": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Properties": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  "Vehicles": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "Marine": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  "Art": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Watches": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Crypto": "bg-green-500/10 text-green-500 border-green-500/20",
};

const formatCurrency = (value: number | null, currency = "EUR") => {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
};

// Calculate CAGR (Compound Annual Growth Rate)
const calculateCAGR = (currentValue: number, purchasePrice: number, purchaseDate: string): number | null => {
  if (!purchasePrice || purchasePrice <= 0 || !purchaseDate) return null;
  
  const today = new Date();
  const purchase = new Date(purchaseDate);
  const yearsHeld = (today.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (yearsHeld <= 0.01) return null; // Less than ~4 days
  
  // CAGR = (EndValue / StartValue)^(1/years) - 1
  const cagr = Math.pow(currentValue / purchasePrice, 1 / yearsHeld) - 1;
  return cagr * 100; // Return as percentage
};

export default function WealthAssetsTable() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<WealthAsset | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesAsset, setNotesAsset] = useState<WealthAsset | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["wealth-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_assets")
        .select("*")
        .order("category", { ascending: true })
        .order("current_value", { ascending: false });

      if (error) throw error;
      return data as WealthAsset[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wealth_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-assets"] });
      toast.success("Ativo eliminado");
    },
    onError: () => {
      toast.error("Erro ao eliminar ativo");
    },
  });

  const handleEdit = (asset: WealthAsset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAsset(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAsset(null);
  };

  // Calculate totals first
  const totalValue = assets
    .filter((a) => a.status !== "In Recovery")
    .reduce((sum, a) => sum + (a.current_value || 0), 0);

  // Group assets by category with category totals
  const groupedAssets = assets.reduce((acc, asset) => {
    const cat = asset.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(asset);
    return acc;
  }, {} as Record<string, WealthAsset[]>);

  // Calculate category totals for weight calculations
  const categoryTotals = Object.entries(groupedAssets).reduce((acc, [cat, catAssets]) => {
    acc[cat] = catAssets
      .filter((a) => a.status !== "In Recovery")
      .reduce((sum, a) => sum + (a.current_value || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const totalPL = assets
    .filter((a) => a.status !== "In Recovery")
    .reduce((sum, a) => sum + (a.profit_loss_value || 0), 0);

  const recoveryAssets = assets.filter((a) => a.status === "In Recovery");
  const recoveryTotal = recoveryAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        A carregar ativos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Valor Total: {formatCurrency(totalValue)} | P/L:{" "}
          <span className={cn(totalPL >= 0 ? "text-green-500" : "text-red-500")}>
            {formatCurrency(totalPL)}
          </span>
        </p>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Ativo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="w-[220px] py-1">Posição</TableHead>
              <TableHead className="text-right py-1">Valor Atual</TableHead>
              <TableHead className="text-right py-1">P/L</TableHead>
              <TableHead className="text-right py-1">CAGR</TableHead>
              <TableHead className="text-right py-1">Yld Exp.</TableHead>
              <TableHead className="text-right py-1">Peso Cat.</TableHead>
              <TableHead className="text-right py-1">Peso Total</TableHead>
              <TableHead className="w-[80px] py-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const sortedCategories = Object.entries(groupedAssets)
                .filter(([cat]) => cat !== "In Recovery");
              

              return sortedCategories.map(([category, categoryAssets], index) => {
                const Icon = categoryIcons[category] || Coins;
                const colorClass = categoryColors[category] || "bg-muted text-muted-foreground";
                const filteredAssets = categoryAssets.filter((a) => a.status !== "In Recovery");
                
                const categoryTotal = filteredAssets.reduce((s, a) => s + (a.current_value || 0), 0);
                const categoryPL = filteredAssets.reduce((s, a) => s + (a.profit_loss_value || 0), 0);
                
                // Calculate weighted CAGR for category
                let weightedCAGRSum = 0;
                let weightedCAGRDenom = 0;
                filteredAssets.forEach((asset) => {
                  const cagr = calculateCAGR(
                    asset.current_value || 0,
                    asset.purchase_price || 0,
                    asset.purchase_date || ""
                  );
                  if (cagr !== null && asset.current_value) {
                    weightedCAGRSum += cagr * asset.current_value;
                    weightedCAGRDenom += asset.current_value;
                  }
                });
                const categoryCAGR = weightedCAGRDenom > 0 ? weightedCAGRSum / weightedCAGRDenom : null;

                const isCollapsed = collapsedCategories[category] ?? false;

                return (
                  <>
                    <TableRow 
                      key={`header-${category}`} 
                      className="bg-muted/50 h-8 cursor-pointer hover:bg-muted/70"
                      onClick={() => toggleCategory(category)}
                    >
                      <TableCell className="font-semibold py-1">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <Icon className="h-3.5 w-3.5" />
                          {category}
                          <span className="text-muted-foreground font-normal ml-1">{filteredAssets.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold py-1">
                        {formatCurrency(categoryTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold py-1">
                        <span className={cn(categoryPL >= 0 ? "text-green-500" : "text-red-500")}>
                          {formatCurrency(categoryPL)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold py-1">
                        {categoryCAGR !== null ? (
                          <span className={cn(categoryCAGR >= 0 ? "text-green-500" : "text-red-500")}>
                            {formatPercent(categoryCAGR)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground py-1">—</TableCell>
                      <TableCell className="text-right text-muted-foreground py-1">—</TableCell>
                      <TableCell className="text-right font-semibold text-muted-foreground py-1">
                        {totalValue > 0 ? formatPercent((categoryTotal / totalValue) * 100) : "—"}
                      </TableCell>
                      <TableCell className="py-1"></TableCell>
                    </TableRow>
                    {!isCollapsed && filteredAssets.map((asset, assetIndex) => (
                        <TableRow key={asset.id} className="h-8">
                          <TableCell className="font-medium py-1">
                            <div className="flex items-start gap-2 leading-tight">
                              <span className="text-muted-foreground min-w-[16px]">{assetIndex + 1}.</span>
                              <div className="flex flex-col">
                                <span>{asset.name}</span>
                                {asset.subcategory && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {asset.subcategory}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {formatCurrency(asset.current_value, asset.currency || "EUR")}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {asset.profit_loss_value !== null ? (
                              <div className="flex items-center justify-end gap-1">
                                {asset.profit_loss_value >= 0 ? (
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-red-500" />
                                )}
                                <span
                                  className={cn(
                                    asset.profit_loss_value >= 0 ? "text-green-500" : "text-red-500"
                                  )}
                                >
                                  {formatCurrency(asset.profit_loss_value)}
                                </span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {(() => {
                              const cagr = calculateCAGR(
                                asset.current_value || 0,
                                asset.purchase_price || 0,
                                asset.purchase_date || ""
                              );
                              if (cagr === null) return "—";
                              return (
                                <span className={cn(cagr >= 0 ? "text-green-500" : "text-red-500")}>
                                  {formatPercent(cagr)}
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {formatPercent(asset.yield_expected)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground py-1">
                            {categoryTotal > 0 && asset.current_value
                              ? formatPercent((asset.current_value / categoryTotal) * 100)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {totalValue > 0 && asset.current_value
                              ? formatPercent((asset.current_value / totalValue) * 100)
                              : "—"}
                          </TableCell>
                          <TableCell className="py-1">
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotesAsset(asset);
                                  setNotesDialogOpen(true);
                                }}
                                title="Notas de Research"
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(asset);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate(asset.id);
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
              });
            })()}
          </TableBody>
        </Table>
      </div>

      {/* Recovery Section */}
      {recoveryAssets.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5">
          <div className="px-4 py-3 border-b border-amber-500/30">
            <h4 className="font-semibold text-amber-600">
              Ativos em Recuperação — {formatCurrency(recoveryTotal)}
            </h4>
          </div>
          <Table>
            <TableBody>
              {recoveryAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(asset.current_value)}
                  </TableCell>
                  <TableCell className="w-[80px]">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(asset)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteMutation.mutate(asset.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <WealthAssetDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        asset={editingAsset}
      />

      {notesAsset && (
        <WealthAssetNotesDialog
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
          assetId={notesAsset.id}
          assetName={notesAsset.name}
        />
      )}
    </div>
  );
}
