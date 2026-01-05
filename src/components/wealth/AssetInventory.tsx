import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Eye, EyeOff } from "lucide-react";
import { WealthAsset, formatEUR, calculatePL } from "@/services/wealthService";
import { cn } from "@/lib/utils";
import AssetDetailDrawer from "./AssetDetailDrawer";
import AssetFormDialog from "./AssetFormDialog";

interface AssetInventoryProps {
  assets: WealthAsset[];
  onRefresh: () => void;
}

const CATEGORY_ORDER = ['Real Estate', 'Crypto', 'Fine Art', 'Watches', 'Vehicles', 'Private Equity', 'Cash', 'Other'];

const AssetInventory = ({ assets, onRefresh }: AssetInventoryProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [showRecovery, setShowRecovery] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<WealthAsset | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (a.status === 'Recovery') return showRecovery;
      return a.status !== 'Sold';
    });
  }, [assets, showRecovery]);

  const groupedAssets = useMemo(() => {
    const grouped = filteredAssets.reduce((acc, asset) => {
      if (!acc[asset.category]) acc[asset.category] = [];
      acc[asset.category].push(asset);
      return acc;
    }, {} as Record<string, WealthAsset[]>);

    return CATEGORY_ORDER
      .filter(cat => grouped[cat]?.length > 0)
      .map(cat => ({ category: cat, assets: grouped[cat] }));
  }, [filteredAssets]);

  const totalPortfolioValue = filteredAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>;
      case 'Recovery':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Recovery</Badge>;
      case 'Pending':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="border border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Asset Inventory
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-recovery"
                  checked={showRecovery}
                  onCheckedChange={setShowRecovery}
                />
                <Label htmlFor="show-recovery" className="text-sm text-slate-600 cursor-pointer">
                  {showRecovery ? <Eye className="h-4 w-4 inline mr-1" /> : <EyeOff className="h-4 w-4 inline mr-1" />}
                  Recovery Assets
                </Label>
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Asset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <div className="col-span-3">Asset Name</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Purchase Price</div>
            <div className="col-span-2 text-right">Current Value</div>
            <div className="col-span-2 text-right">P/L</div>
            <div className="col-span-1 text-right">Yield</div>
            <div className="col-span-1 text-right">Weight</div>
          </div>

          {/* Grouped Assets */}
          {groupedAssets.map(({ category, assets: categoryAssets }) => {
            const categoryTotal = categoryAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);
            const categoryPurchase = categoryAssets.reduce((sum, a) => sum + (a.purchase_price || 0), 0);
            const categoryPL = calculatePL(categoryPurchase, categoryTotal);

            return (
              <Collapsible
                key={category}
                open={expandedCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200 cursor-pointer hover:bg-slate-150 transition-colors">
                    <div className="col-span-3 flex items-center gap-2 font-semibold text-slate-800">
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {category}
                      <Badge variant="secondary" className="ml-2 font-normal">
                        {categoryAssets.length}
                      </Badge>
                    </div>
                    <div className="col-span-1"></div>
                    <div className="col-span-2 text-right font-mono text-sm text-slate-600">
                      {formatEUR(categoryPurchase)}
                    </div>
                    <div className="col-span-2 text-right font-mono text-sm font-semibold">
                      {formatEUR(categoryTotal)}
                    </div>
                    <div className={cn(
                      "col-span-2 text-right font-mono text-sm font-semibold",
                      categoryPL.value >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {categoryPL.value >= 0 ? '+' : ''}{formatEUR(categoryPL.value)}
                      <span className="text-xs ml-1">
                        ({categoryPL.percent >= 0 ? '+' : ''}{categoryPL.percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="col-span-1"></div>
                    <div className="col-span-1 text-right font-mono text-sm text-slate-600">
                      {((categoryTotal / totalPortfolioValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {categoryAssets.map((asset) => {
                    const pl = calculatePL(asset.purchase_price, asset.current_value);
                    const weight = totalPortfolioValue > 0 
                      ? (asset.current_value / totalPortfolioValue) * 100 
                      : 0;

                    return (
                      <div
                        key={asset.id}
                        className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div className="col-span-3 pl-6 flex items-center gap-2">
                          <span className="text-sm text-slate-800 truncate">{asset.name}</span>
                          {asset.subcategory && (
                            <span className="text-xs text-slate-400">({asset.subcategory})</span>
                          )}
                        </div>
                        <div className="col-span-1">
                          {getStatusBadge(asset.status)}
                        </div>
                        <div className="col-span-2 text-right font-mono text-sm text-slate-600">
                          {formatEUR(asset.purchase_price)}
                        </div>
                        <div className="col-span-2 text-right font-mono text-sm font-medium text-slate-900">
                          {formatEUR(asset.current_value)}
                        </div>
                        <div className={cn(
                          "col-span-2 text-right font-mono text-sm",
                          pl.value >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {pl.value >= 0 ? '+' : ''}{formatEUR(pl.value)}
                          <span className="text-xs ml-1">
                            ({pl.percent >= 0 ? '+' : ''}{pl.percent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="col-span-1 text-right font-mono text-sm text-slate-600">
                          {asset.yield_percent ? `${asset.yield_percent.toFixed(1)}%` : '-'}
                        </div>
                        <div className="col-span-1 text-right font-mono text-sm text-slate-600">
                          {weight.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* Total Footer */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-900 text-white font-semibold">
            <div className="col-span-3">Total Portfolio</div>
            <div className="col-span-1"></div>
            <div className="col-span-2 text-right font-mono">
              {formatEUR(filteredAssets.reduce((sum, a) => sum + (a.purchase_price || 0), 0))}
            </div>
            <div className="col-span-2 text-right font-mono">
              {formatEUR(totalPortfolioValue)}
            </div>
            <div className={cn(
              "col-span-2 text-right font-mono",
              (() => {
                const totalPurchase = filteredAssets.reduce((sum, a) => sum + (a.purchase_price || 0), 0);
                const pl = calculatePL(totalPurchase, totalPortfolioValue);
                return pl.value >= 0 ? "text-emerald-400" : "text-red-400";
              })()
            )}>
              {(() => {
                const totalPurchase = filteredAssets.reduce((sum, a) => sum + (a.purchase_price || 0), 0);
                const pl = calculatePL(totalPurchase, totalPortfolioValue);
                return `${pl.value >= 0 ? '+' : ''}${formatEUR(pl.value)} (${pl.percent >= 0 ? '+' : ''}${pl.percent.toFixed(1)}%)`;
              })()}
            </div>
            <div className="col-span-1"></div>
            <div className="col-span-1 text-right font-mono">100%</div>
          </div>
        </CardContent>
      </Card>

      <AssetDetailDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onUpdate={onRefresh}
      />

      <AssetFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={onRefresh}
      />
    </>
  );
};

export default AssetInventory;
