import { Card, CardContent } from "@/components/ui/card";
import { formatEUR, WealthAsset } from "@/services/wealthService";
import { TrendingUp, TrendingDown, Wallet, Building, AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WealthKPICardsProps {
  assets: WealthAsset[];
}

const WealthKPICards = ({ assets }: WealthKPICardsProps) => {
  const activeAssets = assets.filter(a => a.status !== 'Sold');
  const recoveryAssets = assets.filter(a => a.status === 'Recovery');
  
  const totalAssets = activeAssets
    .filter(a => a.status !== 'Recovery')
    .reduce((sum, a) => sum + (a.current_value || 0), 0);
  
  const totalRecovery = recoveryAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  
  const totalPurchasePrice = activeAssets
    .filter(a => a.status !== 'Recovery')
    .reduce((sum, a) => sum + (a.purchase_price || 0), 0);
  
  const ytdPL = totalAssets - totalPurchasePrice;
  const ytdPLPercent = totalPurchasePrice > 0 ? (ytdPL / totalPurchasePrice) * 100 : 0;

  const kpis = [
    {
      title: "Net Worth",
      value: formatEUR(totalAssets),
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Assets",
      value: activeAssets.filter(a => a.status !== 'Recovery').length.toString(),
      subtitle: "Active positions",
      icon: Building,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
    },
    {
      title: "YTD P/L",
      value: formatEUR(ytdPL),
      subtitle: `${ytdPLPercent >= 0 ? '+' : ''}${ytdPLPercent.toFixed(2)}%`,
      icon: ytdPL >= 0 ? TrendingUp : TrendingDown,
      color: ytdPL >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: ytdPL >= 0 ? "bg-emerald-50" : "bg-red-50",
      valueColor: ytdPL >= 0 ? "text-emerald-700" : "text-red-700",
    },
    {
      title: "Assets in Recovery",
      value: formatEUR(totalRecovery),
      subtitle: `${recoveryAssets.length} distressed`,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="border border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {kpi.title}
                </p>
                <p className={cn("text-2xl font-bold font-mono", kpi.valueColor || "text-slate-900")}>
                  {kpi.value}
                </p>
                {kpi.subtitle && (
                  <p className={cn("text-sm", kpi.valueColor || "text-slate-500")}>
                    {kpi.subtitle}
                  </p>
                )}
              </div>
              <div className={cn("p-2.5 rounded-lg", kpi.bgColor)}>
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WealthKPICards;
