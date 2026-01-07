import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MarketHoldingsTable from "@/components/financial/wealth/MarketHoldingsTable";

export default function MarketsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Holdings</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie os seus investimentos em contas de mercado.
        </p>
      </div>

      <MarketHoldingsTable />
    </div>
  );
}
