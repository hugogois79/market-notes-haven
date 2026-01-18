import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useForecastCalculations } from "@/hooks/useForecastCalculations";

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

  // Use shared forecast calculations hook
  const {
    assets,
    date3M,
    date6M,
    date1Y,
    projectedTotal3M,
    projectedTotal6M,
    projectedTotal1Y,
  } = useForecastCalculations();

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

  // Get forecast values from hook (already calculated with same logic as table)
  const forecast3M = assets.length > 0 ? projectedTotal3M : null;
  const forecast6M = assets.length > 0 ? projectedTotal6M : null;
  const forecast1Y = assets.length > 0 ? projectedTotal1Y : null;

  // Build chart data with historical + forecast points
  const historicalData = snapshots.map((s, index) => {
    const prevSnapshot = index > 0 ? snapshots[index - 1] : null;
    const valueDiff = prevSnapshot ? s.total_value - prevSnapshot.total_value : null;
    const valueDiffPercent = prevSnapshot && prevSnapshot.total_value > 0 
      ? ((s.total_value - prevSnapshot.total_value) / prevSnapshot.total_value) * 100 
      : null;
    const plDiff = prevSnapshot ? s.total_pl - prevSnapshot.total_pl : null;
    const plDiffPercent = prevSnapshot && prevSnapshot.total_pl !== 0
      ? ((s.total_pl - prevSnapshot.total_pl) / Math.abs(prevSnapshot.total_pl)) * 100
      : null;

    return {
      date: format(new Date(s.snapshot_date), "dd MMM", { locale: pt }),
      fullDate: s.snapshot_date,
      value: s.total_value,
      pl: s.total_pl,
      yield: s.average_yield,
      forecast: null as number | null,
      valueDiff,
      valueDiffPercent,
      plDiff,
      plDiffPercent,
    };
  });

  // Add forecast points (only value projections)
  const forecastData = assets.length > 0 ? [
    {
      date: format(date3M, "dd MMM", { locale: pt }),
      fullDate: format(date3M, "yyyy-MM-dd"),
      value: null as number | null,
      pl: null as number | null,
      yield: null,
      forecast: forecast3M,
      valueDiff: null as number | null,
      valueDiffPercent: null as number | null,
      plDiff: null as number | null,
      plDiffPercent: null as number | null,
    },
    {
      date: format(date6M, "dd MMM", { locale: pt }),
      fullDate: format(date6M, "yyyy-MM-dd"),
      value: null,
      pl: null,
      yield: null,
      forecast: forecast6M,
      valueDiff: null,
      valueDiffPercent: null,
      plDiff: null,
      plDiffPercent: null,
    },
    {
      date: format(date1Y, "dd MMM", { locale: pt }),
      fullDate: format(date1Y, "yyyy-MM-dd"),
      value: null,
      pl: null,
      yield: null,
      forecast: forecast1Y,
      valueDiff: null,
      valueDiffPercent: null,
      plDiff: null,
      plDiffPercent: null,
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
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;

                  const formatDiff = (diff: number | null, percent: number | null) => {
                    if (diff === null) return null;
                    const sign = diff >= 0 ? "+" : "";
                    const percentStr = percent !== null ? ` (${sign}${percent.toFixed(1)}%)` : "";
                    return `${sign}${formatCurrency(diff)}${percentStr}`;
                  };

                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-medium mb-2">
                        {data.fullDate && format(new Date(data.fullDate), "dd MMMM yyyy", { locale: pt })}
                      </p>
                      {data.value !== null && (
                        <p>Valor Total : {formatCurrency(data.value)}</p>
                      )}
                      {data.valueDiff !== null && (
                        <p className={data.valueDiff >= 0 ? "text-green-500" : "text-red-500"}>
                          Δ Valor: {formatDiff(data.valueDiff, data.valueDiffPercent)}
                        </p>
                      )}
                      {data.pl !== null && (
                        <p className={data.pl >= 0 ? "text-green-500" : "text-red-500"}>
                          P/L : {formatCurrency(data.pl)}
                        </p>
                      )}
                      {data.plDiff !== null && (
                        <p className={data.plDiff >= 0 ? "text-green-500" : "text-red-500"}>
                          Δ P/L: {formatDiff(data.plDiff, data.plDiffPercent)}
                        </p>
                      )}
                      {data.forecast !== null && data.value === null && (
                        <p className="text-muted-foreground">
                          Projeção: {formatCurrency(data.forecast)}
                        </p>
                      )}
                    </div>
                  );
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