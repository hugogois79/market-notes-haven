import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, TrendingDown, TrendingUp, Circle } from "lucide-react";
import { format, addMonths, addYears, addDays, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import ForecastAdjustmentDialog, { ForecastAdjustment } from "./ForecastAdjustmentDialog";

type ColumnKey = "current" | "custom" | "3m" | "6m" | "1y";
type ColorOption = "none" | "green" | "blue" | "amber" | "red" | "purple";

const COLOR_OPTIONS: { value: ColorOption; label: string; bg: string; text: string }[] = [
  { value: "none", label: "Sem cor", bg: "", text: "" },
  { value: "green", label: "Verde", bg: "bg-emerald-100", text: "text-emerald-700" },
  { value: "blue", label: "Azul", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "amber", label: "Amarelo", bg: "bg-amber-100", text: "text-amber-700" },
  { value: "red", label: "Vermelho", bg: "bg-red-100", text: "text-red-700" },
  { value: "purple", label: "Roxo", bg: "bg-purple-100", text: "text-purple-700" },
];

const CATEGORY_ORDER = [
  "Real Estate",
  "Private Equity",
  "Crypto",
  "Art",
  "Watches",
  "Vehicles",
  "Marine",
  "Cash",
  "Other",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDateShort = (date: Date) =>
  format(date, "dd MMM yy", { locale: pt });

export default function PortfolioForecastTable() {
  const today = new Date();
  const [customDate, setCustomDate] = useState<string>(
    format(addDays(today, 8), "yyyy-MM-dd")
  );
  const [adjustments, setAdjustments] = useState<ForecastAdjustment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [columnColors, setColumnColors] = useState<Record<ColumnKey, ColorOption>>({
    current: "none",
    custom: "none",
    "3m": "none",
    "6m": "none",
    "1y": "none",
  });

  const handleSetColumnColor = (column: ColumnKey, color: ColorOption) => {
    setColumnColors((prev) => ({ ...prev, [column]: color }));
  };

  const getColumnStyle = (column: ColumnKey) => {
    const color = columnColors[column];
    const option = COLOR_OPTIONS.find((c) => c.value === color);
    return option ? { bg: option.bg, text: option.text } : { bg: "", text: "" };
  };

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["wealth-assets-forecast"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wealth_assets")
        .select("id, name, category, subcategory, current_value, profit_loss_value")
        .eq("user_id", user.id)
        .neq("status", "In Recovery")
        .order("category")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch future transactions with assets (date >= today)
  const { data: futureTransactions = [] } = useQuery({
    queryKey: ["future-transactions-with-assets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const todayStr = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("id, date, amount, transaction_type, asset_id, affects_asset_value")
        .eq("user_id", user.id)
        .not("asset_id", "is", null)
        .gte("date", todayStr)
        .order("date");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch ALL transactions for cashflow calculation
  const { data: allTransactions = [] } = useQuery({
    queryKey: ["all-wealth-transactions-cashflow"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("id, date, amount")
        .eq("user_id", user.id)
        .order("date");

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate cashflow position (accumulated balance) up to a target date
  const getCashflowPosition = (targetDate: Date) => {
    return allTransactions
      .filter((tx) => new Date(tx.date) <= targetDate)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const handleAddAdjustment = (adjustment: ForecastAdjustment) => {
    setAdjustments((prev) => [...prev, adjustment]);
  };

  const handleRemoveAdjustment = (id: string) => {
    setAdjustments((prev) => prev.filter((a) => a.id !== id));
  };

  // Get combined delta (manual adjustments + future transactions) for an asset up to a target date
  const getAssetDelta = (assetId: string, targetDate: Date) => {
    // Manual adjustments delta
    const manualDelta = adjustments
      .filter((adj) => adj.assetId === assetId && new Date(adj.date) <= targetDate)
      .reduce((delta, adj) => {
        return adj.type === "credit" ? delta + adj.amount : delta - adj.amount;
      }, 0);

    // Future transactions delta
    // O amount já tem sinal: positivo (crédito/venda) ou negativo (débito/compra)
    // Inverter para o impacto no ativo: venda reduz, compra aumenta
    // Only include transactions that affect asset value
    const transactionDelta = futureTransactions
      .filter((tx) => tx.asset_id === assetId && new Date(tx.date) <= targetDate && tx.affects_asset_value !== false)
      .reduce((delta, tx) => delta - tx.amount, 0);

    return manualDelta + transactionDelta;
  };

  // Get total delta for all assets (for totals row)
  const getTotalDelta = (targetDate: Date) => {
    const manualDelta = adjustments
      .filter((adj) => new Date(adj.date) <= targetDate)
      .reduce((sum, adj) => sum + (adj.type === "credit" ? adj.amount : -adj.amount), 0);

    // Only include transactions that affect asset value
    const transactionDelta = futureTransactions
      .filter((tx) => new Date(tx.date) <= targetDate && tx.affects_asset_value !== false)
      .reduce((sum, tx) => sum - tx.amount, 0);

    return manualDelta + transactionDelta;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Dates for forecasts
  const date3M = addMonths(today, 3);
  const date6M = addMonths(today, 6);
  const date1Y = addYears(today, 1);
  const customDateObj = new Date(customDate);
  
  // Calculate growth factor for custom date based on 5% annual rate
  const daysToCustom = differenceInDays(customDateObj, today);
  const customGrowthFactor = Math.pow(1.05, daysToCustom / 365);

  // Group assets by category
  const groupedAssets = assets.reduce((acc, asset) => {
    const cat = asset.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(asset);
    return acc;
  }, {} as Record<string, typeof assets>);

  // Calculate base totals (without adjustments)
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const categoryTotals = Object.entries(groupedAssets).reduce((acc, [cat, items]) => {
    acc[cat] = items.reduce((s, a) => s + (a.current_value || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  // Sort categories
  const sortedCategories = Object.keys(groupedAssets).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  // Calculate total deltas for each forecast column (including future transactions)
  const totalDeltaCustom = getTotalDelta(customDateObj);
  const totalDelta3M = getTotalDelta(date3M);
  const totalDelta6M = getTotalDelta(date6M);
  const totalDelta1Y = getTotalDelta(date1Y);

  return (
    <div className="space-y-4">
      {/* Manual Adjustments Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {adjustments.map((adj) => (
            <div
              key={adj.id}
              className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md"
            >
              <span className={adj.type === "credit" ? "text-green-600" : "text-red-600"}>
                {adj.type === "credit" ? "+" : "-"}
                {formatCurrency(adj.amount)}
              </span>
              <span className="text-muted-foreground">em {adj.assetName}</span>
              <span className="text-muted-foreground">({format(new Date(adj.date), "dd/MM")})</span>
              <button
                onClick={() => handleRemoveAdjustment(adj.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Ajuste
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Ativo</TableHead>
            <TableHead className="text-right">
              <div>Valor Atual</div>
              <div className="text-[10px] text-muted-foreground font-normal">
                {formatDateShort(today)}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-6 w-28 text-xs px-1"
                />
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div>3M</div>
              <div className="text-[10px] text-muted-foreground font-normal">
                {formatDateShort(date3M)}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div>6M</div>
              <div className="text-[10px] text-muted-foreground font-normal">
                {formatDateShort(date6M)}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div>1Y</div>
              <div className="text-[10px] text-muted-foreground font-normal">
                {formatDateShort(date1Y)}
              </div>
            </TableHead>
            <TableHead className="text-right">% Portfolio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCategories.map((category) => {
            const categoryAssets = groupedAssets[category];
            const catTotal = categoryTotals[category] || 0;
            const catWeight = totalValue > 0 ? (catTotal / totalValue) * 100 : 0;

            return (
              <>
                {/* Category header */}
                <TableRow key={`cat-${category}`} className="bg-muted/50">
                  <TableCell colSpan={7} className="font-semibold text-xs uppercase tracking-wide">
                    {category} ({catWeight.toFixed(1)}%)
                  </TableCell>
                </TableRow>

                {/* Assets */}
                {categoryAssets.map((asset) => {
                  const value = asset.current_value || 0;
                  const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
                  
                  // Get combined deltas (adjustments + future transactions) for each forecast date
                  const deltaCustom = getAssetDelta(asset.id, customDateObj);
                  const delta3M = getAssetDelta(asset.id, date3M);
                  const delta6M = getAssetDelta(asset.id, date6M);
                  const delta1Y = getAssetDelta(asset.id, date1Y);
                  
                  // Projections based on 5% annual growth + adjustments
                  const forecastCustom = (value + deltaCustom) * customGrowthFactor;
                  const forecast3M = (value + delta3M) * Math.pow(1.05, 0.25);
                  const forecast6M = (value + delta6M) * Math.pow(1.05, 0.5);
                  const forecast1Y = (value + delta1Y) * 1.05;

                  const hasAdjustment = deltaCustom !== 0 || delta3M !== 0 || delta6M !== 0 || delta1Y !== 0;

                  return (
                    <TableRow key={asset.id} className="text-xs">
                      <TableCell className="py-1.5">
                        <div className="font-medium">{asset.name}</div>
                        {asset.subcategory && (
                          <div className="text-muted-foreground text-[10px]">
                            {asset.subcategory}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right py-1.5 ${getColumnStyle("current").bg}`}>{formatCurrency(value)}</TableCell>
                      <TableCell className={`text-right py-1.5 ${getColumnStyle("custom").bg} ${deltaCustom !== 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                        {formatCurrency(forecastCustom)}
                      </TableCell>
                      <TableCell className={`text-right py-1.5 ${getColumnStyle("3m").bg} ${delta3M !== 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                        {formatCurrency(forecast3M)}
                      </TableCell>
                      <TableCell className={`text-right py-1.5 ${getColumnStyle("6m").bg} ${delta6M !== 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                        {formatCurrency(forecast6M)}
                      </TableCell>
                      <TableCell className={`text-right py-1.5 ${getColumnStyle("1y").bg} ${delta1Y !== 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}`}>
                        {formatCurrency(forecast1Y)}
                      </TableCell>
                      <TableCell className="text-right py-1.5">{weight.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </>
            );
          })}

          {/* Cashflow row */}
          <TableRow className="bg-emerald-50/50 border-t">
            <TableCell className="py-2 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-base">💰</span>
                <span>Cashflow</span>
              </div>
            </TableCell>
            <TableCell className={`text-right py-2 font-medium ${getColumnStyle("current").bg} ${getCashflowPosition(today) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(getCashflowPosition(today))}
            </TableCell>
            <TableCell className={`text-right py-2 font-medium ${getColumnStyle("custom").bg} ${getCashflowPosition(customDateObj) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(getCashflowPosition(customDateObj))}
            </TableCell>
            <TableCell className={`text-right py-2 font-medium ${getColumnStyle("3m").bg} ${getCashflowPosition(date3M) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(getCashflowPosition(date3M))}
            </TableCell>
            <TableCell className={`text-right py-2 font-medium ${getColumnStyle("6m").bg} ${getCashflowPosition(date6M) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(getCashflowPosition(date6M))}
            </TableCell>
            <TableCell className={`text-right py-2 font-medium ${getColumnStyle("1y").bg} ${getCashflowPosition(date1Y) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(getCashflowPosition(date1Y))}
            </TableCell>
            <TableCell className="text-right py-2 text-muted-foreground">—</TableCell>
          </TableRow>

          {/* Total row */}
          <TableRow className="bg-primary/5 border-t-2 font-semibold">
            <TableCell className="py-2">Total Líquido</TableCell>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <TableCell className={`text-right py-2 cursor-context-menu ${getColumnStyle("current").bg}`}>
                  {formatCurrency(totalValue + getCashflowPosition(today))}
                </TableCell>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-background border shadow-lg z-50">
                {COLOR_OPTIONS.map((opt) => (
                  <ContextMenuItem key={opt.value} onClick={() => handleSetColumnColor("current", opt.value)}>
                    <Circle className={`h-3 w-3 mr-2 ${opt.value !== "none" ? opt.bg : ""}`} fill={opt.value !== "none" ? "currentColor" : "none"} />
                    {opt.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuContent>
            </ContextMenu>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <TableCell className={`text-right py-2 cursor-context-menu ${getColumnStyle("custom").bg} ${totalDeltaCustom !== 0 ? "text-blue-600" : ""}`}>
                  {formatCurrency((totalValue + totalDeltaCustom) * customGrowthFactor + getCashflowPosition(customDateObj))}
                </TableCell>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-background border shadow-lg z-50">
                {COLOR_OPTIONS.map((opt) => (
                  <ContextMenuItem key={opt.value} onClick={() => handleSetColumnColor("custom", opt.value)}>
                    <Circle className={`h-3 w-3 mr-2 ${opt.value !== "none" ? opt.bg : ""}`} fill={opt.value !== "none" ? "currentColor" : "none"} />
                    {opt.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuContent>
            </ContextMenu>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <TableCell className={`text-right py-2 cursor-context-menu ${getColumnStyle("3m").bg} ${totalDelta3M !== 0 ? "text-blue-600" : ""}`}>
                  {formatCurrency((totalValue + totalDelta3M) * Math.pow(1.05, 0.25) + getCashflowPosition(date3M))}
                </TableCell>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-background border shadow-lg z-50">
                {COLOR_OPTIONS.map((opt) => (
                  <ContextMenuItem key={opt.value} onClick={() => handleSetColumnColor("3m", opt.value)}>
                    <Circle className={`h-3 w-3 mr-2 ${opt.value !== "none" ? opt.bg : ""}`} fill={opt.value !== "none" ? "currentColor" : "none"} />
                    {opt.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuContent>
            </ContextMenu>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <TableCell className={`text-right py-2 cursor-context-menu ${getColumnStyle("6m").bg} ${totalDelta6M !== 0 ? "text-blue-600" : ""}`}>
                  {formatCurrency((totalValue + totalDelta6M) * Math.pow(1.05, 0.5) + getCashflowPosition(date6M))}
                </TableCell>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-background border shadow-lg z-50">
                {COLOR_OPTIONS.map((opt) => (
                  <ContextMenuItem key={opt.value} onClick={() => handleSetColumnColor("6m", opt.value)}>
                    <Circle className={`h-3 w-3 mr-2 ${opt.value !== "none" ? opt.bg : ""}`} fill={opt.value !== "none" ? "currentColor" : "none"} />
                    {opt.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuContent>
            </ContextMenu>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <TableCell className={`text-right py-2 cursor-context-menu ${getColumnStyle("1y").bg} ${totalDelta1Y !== 0 ? "text-blue-600" : ""}`}>
                  {formatCurrency((totalValue + totalDelta1Y) * 1.05 + getCashflowPosition(date1Y))}
                </TableCell>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-background border shadow-lg z-50">
                {COLOR_OPTIONS.map((opt) => (
                  <ContextMenuItem key={opt.value} onClick={() => handleSetColumnColor("1y", opt.value)}>
                    <Circle className={`h-3 w-3 mr-2 ${opt.value !== "none" ? opt.bg : ""}`} fill={opt.value !== "none" ? "currentColor" : "none"} />
                    {opt.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuContent>
            </ContextMenu>
            <TableCell className="text-right py-2">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Observações - Soma das colunas selecionadas */}
      {(() => {
        const selectedColumns = Object.entries(columnColors).filter(([_, color]) => color !== "none");
        if (selectedColumns.length === 0) return null;
        
        const totals: Record<ColumnKey, number> = {
          current: totalValue + getCashflowPosition(today),
          custom: (totalValue + totalDeltaCustom) * customGrowthFactor + getCashflowPosition(customDateObj),
          "3m": (totalValue + totalDelta3M) * Math.pow(1.05, 0.25) + getCashflowPosition(date3M),
          "6m": (totalValue + totalDelta6M) * Math.pow(1.05, 0.5) + getCashflowPosition(date6M),
          "1y": (totalValue + totalDelta1Y) * 1.05 + getCashflowPosition(date1Y),
        };
        
        const columnLabels: Record<ColumnKey, string> = {
          current: "Valor Atual",
          custom: format(customDateObj, "dd/MM/yy"),
          "3m": "3M",
          "6m": "6M",
          "1y": "1Y",
        };
        
        const sumOfSelected = selectedColumns.reduce((sum, [key]) => sum + totals[key as ColumnKey], 0);
        
        return (
          <div className="p-3 bg-muted/30 rounded-md">
            <div className="text-xs font-medium text-muted-foreground mb-2">Observações</div>
            <div className="flex items-center gap-4 flex-wrap">
              {selectedColumns.map(([key, color]) => {
                const opt = COLOR_OPTIONS.find((c) => c.value === color);
                return (
                  <div key={key} className={`flex items-center gap-2 px-2 py-1 rounded ${opt?.bg}`}>
                    <span className={`text-xs font-medium ${opt?.text}`}>{columnLabels[key as ColumnKey]}:</span>
                    <span className={`text-sm font-semibold ${opt?.text}`}>{formatCurrency(totals[key as ColumnKey])}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 ml-auto">
                <span className="text-xs font-medium">Total Selecionado:</span>
                <span className="text-sm font-bold">{formatCurrency(sumOfSelected)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Future Transactions from Cashflow */}
      {futureTransactions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-2 bg-muted/30 rounded-md">
          <span className="text-xs text-muted-foreground font-medium">Transações Futuras:</span>
          {futureTransactions.map((tx) => {
            const asset = assets.find((a) => a.id === tx.asset_id);
            const isAssetSale = tx.transaction_type === "credit";
            const affectsValue = tx.affects_asset_value !== false;
            return (
              <div
                key={tx.id}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                  !affectsValue
                    ? "bg-muted text-muted-foreground border border-muted-foreground/20"
                    : isAssetSale
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {affectsValue ? (
                  isAssetSale ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )
                ) : (
                  <span className="text-[10px]">💰</span>
                )}
                <span className={`font-medium ${!affectsValue ? "line-through opacity-60" : ""}`}>
                  {isAssetSale ? "-" : "+"}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
                <span>em {asset?.name || "Ativo"}</span>
                <span className="text-muted-foreground">
                  ({format(new Date(tx.date), "dd/MM/yy")})
                </span>
                {!affectsValue && (
                  <span className="text-[9px] opacity-60">(custo)</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ForecastAdjustmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assets={assets}
        onSave={handleAddAdjustment}
      />
    </div>
  );
}