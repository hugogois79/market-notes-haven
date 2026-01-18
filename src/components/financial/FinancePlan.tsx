import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Calendar, PieChart, LayoutDashboard, Briefcase, Receipt, Flag, Percent, Save, History, TrendingUpDown, GitBranch, Printer } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import WealthAssetsTable from "./wealth/WealthAssetsTable";
import WealthTransactionsTable from "./wealth/WealthTransactionsTable";
import WealthMilestonesTable from "./wealth/WealthMilestonesTable";
import PortfolioHistoryChart from "./wealth/PortfolioHistoryChart";
import PortfolioForecastTable from "./wealth/PortfolioForecastTable";
import SavePlanVersionDialog from "./wealth/SavePlanVersionDialog";
import PlanVersionsList from "./wealth/PlanVersionsList";
import { useForecastCalculations } from "@/hooks/useForecastCalculations";

interface FinancePlanProps {
  companyId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Real Estate": "#3b82f6",
  "Vehicles": "#f97316",
  "Marine": "#06b6d4",
  "Art": "#8b5cf6",
  "Watches": "#f59e0b",
  "Crypto": "#22c55e",
  "Private Equity": "#ec4899",
  "Cash": "#6b7280",
  "Other": "#94a3b8",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Calculate CAGR (Compound Annual Growth Rate)
const calculateCAGR = (currentValue: number, purchasePrice: number, purchaseDate: string): number | null => {
  if (!purchasePrice || purchasePrice <= 0 || !purchaseDate) return null;
  
  const today = new Date();
  const purchase = new Date(purchaseDate);
  const yearsHeld = (today.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (yearsHeld <= 0) return null;
  
  // CAGR = (EndValue / StartValue)^(1/years) - 1
  const cagr = Math.pow(currentValue / purchasePrice, 1 / yearsHeld) - 1;
  return cagr * 100; // Return as percentage
};

export default function FinancePlan({ companyId }: FinancePlanProps) {
  const queryClient = useQueryClient();
  const [savePlanDialogOpen, setSavePlanDialogOpen] = useState(false);
  const [cashflowPrintFn, setCashflowPrintFn] = useState<(() => Promise<void>) | null>(null);
  
  const handleCashflowPrintReady = useCallback((fn: () => Promise<void>) => {
    setCashflowPrintFn(() => fn);
  }, []);

  // Get forecast calculations for plan versioning
  const {
    projectedTotal3M,
    projectedTotal6M,
    projectedTotal1Y,
    totalValue: forecastTotalValue,
    futureTransactions,
  } = useForecastCalculations();

  const { data: assets = [] } = useQuery({
    queryKey: ["wealth-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wealth_assets")
        .select("*")
        .neq("status", "In Recovery");

      if (error) throw error;
      return data || [];
    },
  });

  // Query for market holdings (for dynamic Markets category calculation)
  const { data: marketHoldings = [] } = useQuery({
    queryKey: ["market-holdings-for-plan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_holdings")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Query for securities (prices and FX rates)
  const { data: securities = [] } = useQuery({
    queryKey: ["securities-for-plan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("securities")
        .select("id, ticker, current_price, security_type");
      if (error) throw error;
      return data || [];
    },
  });

  // Securities map for quick lookup
  const securitiesMap = securities.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {} as Record<string, typeof securities[0]>);

  // Convert value to EUR using FX rates
  const convertToEUR = (value: number, currency: string): number => {
    if (currency === "EUR") return value;
    const pair = `EUR${currency}`;
    const rate = securities.find(s => s.ticker === pair)?.current_price;
    return rate ? value / rate : value;
  };

  // Dynamic value calculation for Markets category
  const getAssetDynamicValue = (asset: typeof assets[0]): number => {
    if (asset.category !== "Markets") {
      return asset.current_value || 0;
    }
    const assetHoldings = marketHoldings.filter(h => h.asset_id === asset.id);
    return assetHoldings.reduce((sum, h) => {
      const quantity = h.quantity || 1;
      const currency = h.currency || "EUR";
      const security = h.security_id ? securitiesMap[h.security_id] : null;
      const currentPrice = security?.current_price || null;
      const isFxSecurity = security?.security_type === "currency";
      const currentValue = isFxSecurity 
        ? quantity 
        : (currentPrice ? currentPrice * quantity : (h.current_value || 0));
      return sum + convertToEUR(currentValue, currency);
    }, 0);
  };

  // Dynamic P/L calculation for Markets category
  // Uses asset.purchase_price as cost basis (aligned with WealthAssetsTable logic)
  const getAssetDynamicPL = (asset: typeof assets[0]): number | null => {
    if (asset.category !== "Markets") {
      return asset.profit_loss_value;
    }
    // Get dynamic current value from holdings
    const totalValueEUR = getAssetDynamicValue(asset);
    // Use purchase_price from the asset as the cost basis (more reliable)
    const totalCostEUR = asset.purchase_price || 0;
    return totalValueEUR - totalCostEUR;
  };

  // Snapshot mutation
  const snapshotMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const allocationByCategory = Object.entries(
        assets.reduce((acc, asset) => {
          const cat = asset.category || "Other";
          acc[cat] = (acc[cat] || 0) + getAssetDynamicValue(asset);
          return acc;
        }, {} as Record<string, number>)
      ).reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

      const { error } = await supabase.from("portfolio_snapshots").upsert({
        user_id: user.id,
        snapshot_date: new Date().toISOString().split("T")[0],
        total_value: totalValue,
        total_pl: totalPL,
        average_yield: weightedAverageCAGR,
        asset_count: assets.length,
        allocation_by_category: allocationByCategory,
      }, { onConflict: "user_id,snapshot_date" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-snapshots"] });
      toast.success("Snapshot guardado com sucesso");
    },
    onError: (error: Error) => {
      console.error("Snapshot error:", error);
      toast.error(`Erro ao guardar snapshot: ${error.message}`);
    },
  });

  // Calculate allocation by category using dynamic values
  const totalValue = assets.reduce((sum, a) => sum + getAssetDynamicValue(a), 0);
  
  const allocationData = Object.entries(
    assets.reduce((acc, asset) => {
      const cat = asset.category || "Other";
      acc[cat] = (acc[cat] || 0) + getAssetDynamicValue(asset);
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.value - a.value);

  const topCategory = allocationData[0];

  // Calculate total P/L using dynamic values
  const totalPL = assets.reduce((sum, a) => sum + (getAssetDynamicPL(a) || 0), 0);

  // Calculate weighted average CAGR using dynamic values
  const assetsWithCAGR = assets
    .map((a) => ({
      ...a,
      dynamicValue: getAssetDynamicValue(a),
      cagr: calculateCAGR(getAssetDynamicValue(a), a.purchase_price || 0, a.purchase_date || ""),
    }))
    .filter((a) => a.cagr !== null && a.dynamicValue > 0);

  const weightedAverageCAGR = assetsWithCAGR.length > 0
    ? assetsWithCAGR.reduce((sum, a) => sum + (a.cagr! * (a.dynamicValue / totalValue)), 0)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Finance Plan</h2>
        <p className="text-sm text-muted-foreground">
          Strategic financial planning and forecasting
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Cashflow
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUpDown className="h-4 w-4" />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="snapshots" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Snapshots
          </TabsTrigger>
          <TabsTrigger value="plan-versions" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Versões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Portfolio ativo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P/L Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(totalPL)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ganhos/Perdas acumulados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assets.length}</div>
                <p className="text-xs text-muted-foreground">
                  No portfolio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rend. Médio</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${weightedAverageCAGR !== null ? (weightedAverageCAGR >= 0 ? "text-green-500" : "text-red-500") : ""}`}>
                  {weightedAverageCAGR !== null ? `${weightedAverageCAGR.toFixed(1)}%` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  CAGR ponderado anual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Alocação</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {topCategory ? (
                  <>
                    <div className="text-2xl font-bold">{topCategory.percentage}%</div>
                    <p className="text-xs text-muted-foreground">
                      {topCategory.name}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">—</div>
                    <p className="text-xs text-muted-foreground">
                      Sem ativos
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Allocation Chart */}
          {allocationData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Alocação do Portfolio</CardTitle>
                <CardDescription>
                  Distribuição do valor por categoria de ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        labelLine={false}
                      >
                        {allocationData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS["Other"]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[item.name] || CATEGORY_COLORS["Other"] }}
                      />
                      <span className="text-muted-foreground">{item.name}:</span>
                      <span className="font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio de Ativos</CardTitle>
              <CardDescription>
                Gestão de ativos, avaliações, P/L e alocação do portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WealthAssetsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Plano Financeiro</CardTitle>
                <CardDescription>
                  Registo de transações, créditos, débitos e saldo corrente.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cashflowPrintFn?.()}
                  disabled={!cashflowPrintFn}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSavePlanDialogOpen(true)}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Guardar Versão
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <WealthTransactionsTable 
                onPrintReady={handleCashflowPrintReady} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                Defina e acompanhe os seus objetivos financeiros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WealthMilestonesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Forecast</CardTitle>
              <CardDescription>
                Projeção do valor do portfolio a 1, 3 e 5 anos (5% CAGR)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioForecastTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Histórico do Portfolio</h3>
              <p className="text-sm text-muted-foreground">
                Evolução semanal do valor e rendimento do portfolio
              </p>
            </div>
            <Button 
              onClick={() => snapshotMutation.mutate()} 
              disabled={snapshotMutation.isPending}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {snapshotMutation.isPending ? "A guardar..." : "Guardar Snapshot"}
            </Button>
          </div>
          <PortfolioHistoryChart />
        </TabsContent>

        <TabsContent value="plan-versions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Versões do Plano</h3>
              <p className="text-sm text-muted-foreground">
                Histórico de versões do plano financeiro para comparação
              </p>
            </div>
            <Button 
              onClick={() => setSavePlanDialogOpen(true)}
              size="sm"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Guardar Versão
            </Button>
          </div>
          <PlanVersionsList
            currentProjected3M={projectedTotal3M}
            currentProjected6M={projectedTotal6M}
            currentProjected1Y={projectedTotal1Y}
            currentTotalValue={forecastTotalValue}
          />
        </TabsContent>
      </Tabs>

      {/* Save Plan Version Dialog */}
      <SavePlanVersionDialog
        open={savePlanDialogOpen}
        onOpenChange={setSavePlanDialogOpen}
        projected3M={projectedTotal3M}
        projected6M={projectedTotal6M}
        projected1Y={projectedTotal1Y}
        totalValue={forecastTotalValue}
        futureTransactions={futureTransactions.map((tx) => ({
          id: tx.id,
          date: tx.date,
          amount: tx.amount,
          asset_id: tx.asset_id,
          affects_asset_value: tx.affects_asset_value,
        }))}
      />
    </div>
  );
}
