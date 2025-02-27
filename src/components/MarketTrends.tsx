
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for market trends
const marketTrends = [
  { name: "S&P 500", price: "4,587.64", change: 0.34, category: "index" },
  { name: "Dow Jones", price: "37,986.40", change: -0.21, category: "index" },
  { name: "NASDAQ", price: "14,239.88", change: 1.01, category: "index" },
  { name: "Bitcoin", price: "64,784.20", change: 2.47, category: "crypto" },
  { name: "Ethereum", price: "3,056.93", change: 1.28, category: "crypto" },
  { name: "Gold", price: "2,345.60", change: 0.17, category: "commodity" },
  { name: "Crude Oil", price: "82.45", change: -1.23, category: "commodity" },
  { name: "EUR/USD", price: "1.0856", change: 0.02, category: "forex" },
];

const MarketTrends = () => {
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Market Trends
        </CardTitle>
        <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">Live</Badge>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {marketTrends.map((item) => (
            <div 
              key={item.name} 
              className="p-3 border-t first:border-l-0 border-l border-border/50 transition-colors hover:bg-secondary/60"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-lg font-semibold mt-1">{item.price}</p>
                </div>
                <div 
                  className={cn(
                    "flex items-center gap-0.5 text-sm",
                    item.change > 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {item.change > 0 ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  <span>{Math.abs(item.change)}%</span>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
                  {item.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketTrends;
