import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";

type MarketHolding = {
  id: string;
  name: string;
  ticker: string | null;
  currency: string | null;
  quantity: number | null;
  cost_basis: number | null;
  current_value: number | null;
  security_id: string | null;
  weight_target: number | null;
};

type Security = {
  id: string;
  name: string;
  ticker: string | null;
  current_price: number | null;
  currency: string | null;
  security_type: string | null;
  change_1d: number | null;
  change_1w: number | null;
  change_ytd: number | null;
};

const TYPE_COLORS: Record<string, string> = {
  equity: "#3b82f6",
  etf: "#8b5cf6",
  bond: "#f59e0b",
  commodity: "#f97316",
  currency: "#22c55e",
  crypto: "#06b6d4",
  other: "#94a3b8",
};

const TYPE_LABELS: Record<string, string> = {
  equity: "Equity",
  etf: "ETF",
  bond: "Bond",
  commodity: "Commodity",
  currency: "Currency",
  crypto: "Crypto",
  other: "Other",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

export default function MarketAnalyticsSummary() {
  const { data: holdings = [] } = useQuery({
    queryKey: ["market-holdings-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_holdings")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as MarketHolding[];
    },
  });

  const { data: securities = [] } = useQuery({
    queryKey: ["securities-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("securities")
        .select("id, name, ticker, current_price, currency, security_type, change_1d, change_1w, change_ytd");
      if (error) throw error;
      return data as Security[];
    },
  });

  const securitiesMap = securities.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {} as Record<string, Security>);

  const fxRates = securities
    .filter(s => s.security_type === 'currency' && s.ticker && s.current_price)
    .reduce((acc, s) => {
      acc[s.ticker!] = s.current_price!;
      return acc;
    }, {} as Record<string, number>);

  const convertToEUR = (value: number, currency: string): number => {
    if (!value || currency === "EUR") return value;
    const fxSymbol = `EUR${currency}`;
    const rate = fxRates[fxSymbol];
    return rate && rate > 0 ? value / rate : value;
  };

  // Compute holding-level data
  const holdingData = holdings.map((h) => {
    const security = h.security_id ? securitiesMap[h.security_id] : null;
    const quantity = h.quantity || 1;
    const currency = h.currency || "EUR";
    const isFx = security?.security_type === "currency";
    const currentPrice = security?.current_price || null;

    const currentValue = isFx
      ? quantity
      : currentPrice ? currentPrice * quantity : (h.current_value || 0);

    const valueEUR = convertToEUR(currentValue, currency);
    const costEUR = convertToEUR(h.cost_basis || 0, currency);
    const plEUR = valueEUR - costEUR;
    const plPercent = costEUR !== 0 ? (plEUR / Math.abs(costEUR)) * 100 : 0;
    const securityType = security?.security_type || "other";
    const weightTarget = h.weight_target || 0;

    return {
      ...h,
      valueEUR,
      costEUR,
      plEUR,
      plPercent,
      securityType,
      weightTarget,
      change1d: security?.change_1d || null,
      changeYtd: security?.change_ytd || null,
    };
  });

  const totalValueEUR = holdingData.reduce((s, h) => s + h.valueEUR, 0);
  const totalCostEUR = holdingData.reduce((s, h) => s + h.costEUR, 0);
  const totalPL = totalValueEUR - totalCostEUR;
  const totalPLPercent = totalCostEUR !== 0 ? (totalPL / Math.abs(totalCostEUR)) * 100 : 0;

  // Allocation by asset type
  const allocationByType = Object.entries(
    holdingData.reduce((acc, h) => {
      const type = h.securityType;
      acc[type] = (acc[type] || 0) + h.valueEUR;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([type, value]) => ({
      name: TYPE_LABELS[type] || type,
      type,
      value,
      percentage: totalValueEUR > 0 ? (value / totalValueEUR) * 100 : 0,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Top/Bottom performers by P/L%
  const performersWithPL = holdingData
    .filter(h => h.costEUR > 0)
    .sort((a, b) => b.plPercent - a.plPercent);

  const topPerformers = performersWithPL.slice(0, 5);
  const bottomPerformers = performersWithPL.slice(-5).reverse();

  // Drift analysis (current weight vs target weight)
  const driftData = holdingData
    .filter(h => h.weightTarget > 0)
    .map(h => {
      const currentWeight = totalValueEUR > 0 ? (h.valueEUR / totalValueEUR) * 100 : 0;
      const drift = currentWeight - h.weightTarget;
      return {
        name: h.ticker || h.name.slice(0, 12),
        current: parseFloat(currentWeight.toFixed(2)),
        target: h.weightTarget,
        drift: parseFloat(drift.toFixed(2)),
      };
    })
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Mercado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValueEUR)}</p>
            <p className="text-xs text-muted-foreground">{holdingData.length} posições</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Base</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCostEUR)}</p>
            <p className="text-xs text-muted-foreground">Capital investido</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">P/L Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPL)}
            </p>
            <p className={`text-xs ${totalPLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(totalPLPercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tipos de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allocationByType.length}</p>
            <p className="text-xs text-muted-foreground">classes de ativos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Allocation by Type Pie Chart */}
        {allocationByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Alocação por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={allocationByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {allocationByType.map((entry) => (
                        <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || TYPE_COLORS.other} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {allocationByType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[item.type] || TYPE_COLORS.other }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drift Analysis */}
        {driftData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Drift vs Target Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driftData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="current" name="Atual" fill="#3b82f6" barSize={12} />
                    <Bar dataKey="target" name="Target" fill="#94a3b8" barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {driftData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="font-mono">{item.name}</span>
                    <span className={`font-medium ${Math.abs(item.drift) > 3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {item.drift > 0 ? '+' : ''}{item.drift}% drift
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top/Bottom Performers */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de performance.</p>
            ) : (
              <div className="space-y-2">
                {topPerformers.map((h, i) => (
                  <div key={h.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium">{h.name}</p>
                        {h.ticker && <p className="text-xs text-muted-foreground">{h.ticker}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatPercent(h.plPercent)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(h.plEUR)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Worst Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bottomPerformers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de performance.</p>
            ) : (
              <div className="space-y-2">
                {bottomPerformers.map((h, i) => (
                  <div key={h.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium">{h.name}</p>
                        {h.ticker && <p className="text-xs text-muted-foreground">{h.ticker}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${h.plPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(h.plPercent)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(h.plEUR)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
