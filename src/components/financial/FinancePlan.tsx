import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Calendar, PieChart } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import WealthAssetsTable from "./wealth/WealthAssetsTable";

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

export default function FinancePlan({ companyId }: FinancePlanProps) {
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

  // Calculate allocation by category
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  
  const allocationData = Object.entries(
    assets.reduce((acc, asset) => {
      const cat = asset.category || "Other";
      acc[cat] = (acc[cat] || 0) + (asset.current_value || 0);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Finance Plan</h2>
        <p className="text-sm text-muted-foreground">
          Strategic financial planning and forecasting
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No goals defined yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projections</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total do portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              Ativos no portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocation</CardTitle>
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
    </div>
  );
}
