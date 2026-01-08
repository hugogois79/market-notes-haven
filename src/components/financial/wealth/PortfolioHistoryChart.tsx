import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, addMonths, addYears, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

interface PortfolioSnapshot {
  id: string;
  snapshot_date: string;
  total_value: number;
  total_pl: number;
  average_yield: number | null;
  asset_count: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function PortfolioHistoryChart() {
  const { data: snapshots = [] } = useQuery({
    queryKey: ["portfolio-snapshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: true });

      if (error) throw error;
      return data as PortfolioSnapshot[];
    },
  });

  // Fetch assets for forecast calculation
  const { data: assets = [] } = useQuery({
    queryKey: ["wealth-assets-for-chart-forecast"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("wealth_assets")
        .select("id, current_value, appreciation_type, annual_rate_percent, consider_appreciation")
        .eq("user_id", user.id)
        .neq("status", "In Recovery");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch ALL transactions for cashflow calculation
  const { data: allTransactions = [] } = useQuery({
    queryKey: ["all-wealth-transactions-chart-cashflow"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("id, date, amount, asset_id, affects_asset_value")
        .eq("user_id", user.id)
        .order("date");

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate cashflow position up to a target date
  const getCashflowPosition = (targetDate: Date) => {
    return allTransactions
      .filter((tx) => new Date(tx.date) <= targetDate)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Get future transaction delta for assets (affects value) up to a target date
  const getAssetTransactionDelta = (assetId: string, targetDate: Date, todayDate: Date) => {
    return allTransactions
      .filter((tx) => 
        tx.asset_id === assetId && 
        new Date(tx.date) > todayDate && 
        new Date(tx.date) <= targetDate && 
        tx.affects_asset_value !== false
      )
      .reduce((delta, tx) => delta - tx.amount, 0);
  };

  // Calculate projected total for a future date (matching forecast table logic)
  const calculateProjectedTotal = (targetDate: Date) => {
    const todayDate = new Date();
    const daysToTarget = differenceInDays(targetDate, todayDate);
    
    let projectedAssetsTotal = 0;
    for (const asset of assets) {
      const value = asset.current_value || 0;
      const assetDelta = getAssetTransactionDelta(asset.id, targetDate, todayDate);
      const useAppreciation = asset.consider_appreciation !== false;
      const annualRate = asset.annual_rate_percent ?? 5;
      const isDepreciation = asset.appreciation_type === "depreciates";
      const effectiveRate = useAppreciation ? (isDepreciation ? -annualRate : annualRate) / 100 : 0;
      const growthFactor = Math.pow(1 + effectiveRate, daysToTarget / 365);
      projectedAssetsTotal += (value + assetDelta) * growthFactor;
    }
    
    return projectedAssetsTotal + getCashflowPosition(targetDate);
  };

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Portfolio</CardTitle>
          <CardDescription>
            Histórico semanal do valor do portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Sem dados históricos. Guarde um snapshot para começar.
          </div>
        </CardContent>
      </Card>
    );
  }

  const today = new Date();
  const lastSnapshot = snapshots[snapshots.length - 1];
  const currentValue = lastSnapshot?.total_value || 0;
  const currentPL = lastSnapshot?.total_pl || 0;

  // Calculate forecast projections
  const date3M = addMonths(today, 3);
  const date6M = addMonths(today, 6);
  const date1Y = addYears(today, 1);

  const forecast3M = assets.length > 0 ? calculateProjectedTotal(date3M) : null;
  const forecast6M = assets.length > 0 ? calculateProjectedTotal(date6M) : null;
  const forecast1Y = assets.length > 0 ? calculateProjectedTotal(date1Y) : null;

  // Build chart data with historical + forecast points
  const historicalData = snapshots.map((s) => ({
    date: format(new Date(s.snapshot_date), "dd MMM", { locale: pt }),
    fullDate: s.snapshot_date,
    value: s.total_value,
    pl: s.total_pl,
    yield: s.average_yield,
    forecast: null as number | null,
  }));

  // Add forecast points (only value projections)
  const forecastData = assets.length > 0 ? [
    {
      date: format(date3M, "dd MMM", { locale: pt }),
      fullDate: format(date3M, "yyyy-MM-dd"),
      value: null as number | null,
      pl: null as number | null,
      yield: null,
      forecast: forecast3M,
    },
    {
      date: format(date6M, "dd MMM", { locale: pt }),
      fullDate: format(date6M, "yyyy-MM-dd"),
      value: null,
      pl: null,
      yield: null,
      forecast: forecast6M,
    },
    {
      date: format(date1Y, "dd MMM", { locale: pt }),
      fullDate: format(date1Y, "yyyy-MM-dd"),
      value: null,
      pl: null,
      yield: null,
      forecast: forecast1Y,
    },
  ] : [];

  // Connect last historical point to forecast
  if (historicalData.length > 0 && forecastData.length > 0) {
    historicalData[historicalData.length - 1].forecast = historicalData[historicalData.length - 1].value;
  }

  const chartData = [...historicalData, ...forecastData];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Portfolio</CardTitle>
        <CardDescription>
          Histórico semanal do valor do portfolio ({snapshots.length} registos)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "value" ? "Valor Total" : "P/L",
                ]}
                labelFormatter={(label, payload) => {
                  if (payload?.[0]?.payload?.fullDate) {
                    return format(new Date(payload[0].payload.fullDate), "dd MMMM yyyy", { locale: pt });
                  }
                  return label;
                }}
              />
              <Legend 
                formatter={(value) => {
                  if (value === "value") return "Valor Total";
                  if (value === "pl") return "P/L";
                  if (value === "forecast") return "Projeção";
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="pl"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2}
                dot={{ fill: "hsl(142 76% 36%)", strokeWidth: 0, r: 3 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--primary))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}