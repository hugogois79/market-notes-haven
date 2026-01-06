import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MarketHoldingsTable from "@/components/financial/wealth/MarketHoldingsTable";

export default function MarketsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="text-muted-foreground">
          Gestão de holdings de mercado nas suas contas Cash.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Holdings</CardTitle>
          <CardDescription>
            Visualize e gerencie os seus investimentos em contas de mercado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarketHoldingsTable />
        </CardContent>
      </Card>
    </div>
  );
}
