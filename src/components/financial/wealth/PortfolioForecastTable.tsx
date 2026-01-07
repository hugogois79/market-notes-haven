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
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { format, addMonths, addYears, addDays, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Dates for forecasts
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

  // Calculate totals
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const categoryTotals = Object.entries(groupedAssets).reduce((acc, [cat, items]) => {
    acc[cat] = items.reduce((s, a) => s + (a.current_value || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  // Sort categories
  const sortedCategories = Object.keys(groupedAssets).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  return (
    <div className="space-y-4">
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
                  <TableCell colSpan={6} className="font-semibold text-xs uppercase tracking-wide">
                    {category} ({catWeight.toFixed(1)}%)
                  </TableCell>
                </TableRow>

                {/* Assets */}
                {categoryAssets.map((asset) => {
                  const value = asset.current_value || 0;
                  const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
                  // Projections based on 5% annual growth
                  const forecastCustom = value * customGrowthFactor;
                  const forecast6M = value * Math.pow(1.05, 0.5);
                  const forecast1Y = value * 1.05;

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
                      <TableCell className="text-right py-1.5">{formatCurrency(value)}</TableCell>
                      <TableCell className="text-right py-1.5 text-muted-foreground">{formatCurrency(forecastCustom)}</TableCell>
                      <TableCell className="text-right py-1.5 text-muted-foreground">{formatCurrency(forecast6M)}</TableCell>
                      <TableCell className="text-right py-1.5 text-muted-foreground">{formatCurrency(forecast1Y)}</TableCell>
                      <TableCell className="text-right py-1.5">{weight.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </>
            );
          })}

          {/* Total row */}
          <TableRow className="bg-primary/5 border-t-2 font-semibold">
            <TableCell className="py-2">Total Portfolio</TableCell>
            <TableCell className="text-right py-2">{formatCurrency(totalValue)}</TableCell>
            <TableCell className="text-right py-2">{formatCurrency(totalValue * customGrowthFactor)}</TableCell>
            <TableCell className="text-right py-2">{formatCurrency(totalValue * Math.pow(1.05, 0.5))}</TableCell>
            <TableCell className="text-right py-2">{formatCurrency(totalValue * 1.05)}</TableCell>
            <TableCell className="text-right py-2">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
