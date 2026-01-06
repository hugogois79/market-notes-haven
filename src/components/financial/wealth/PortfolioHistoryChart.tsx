import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
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

  const chartData = snapshots.map((s) => ({
    date: format(new Date(s.snapshot_date), "dd MMM", { locale: pt }),
    fullDate: s.snapshot_date,
    value: s.total_value,
    pl: s.total_pl,
    yield: s.average_yield,
  }));

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
                formatter={(value) => value === "value" ? "Valor Total" : "P/L"}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="pl"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2}
                dot={{ fill: "hsl(142 76% 36%)", strokeWidth: 0, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}