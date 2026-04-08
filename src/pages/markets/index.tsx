import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketHoldingsTable from "@/components/financial/wealth/MarketHoldingsTable";
import MarketAnalyticsSummary from "@/components/financial/wealth/MarketAnalyticsSummary";
import MarketMovementHistory from "@/components/financial/wealth/MarketMovementHistory";
import { TrendingUp, BarChart3, History } from "lucide-react";

export default function MarketsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Holdings</h1>
        <p className="text-muted-foreground">
          Análise e gestão dos seus investimentos no mercado secundário.
        </p>
      </div>

      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Holdings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análise
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Movimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          <MarketHoldingsTable />
        </TabsContent>

        <TabsContent value="analytics">
          <MarketAnalyticsSummary />
        </TabsContent>

        <TabsContent value="movements">
          <MarketMovementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
