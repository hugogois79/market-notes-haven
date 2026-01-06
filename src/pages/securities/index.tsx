import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SecuritiesTable from "@/components/financial/wealth/SecuritiesTable";

export default function SecuritiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Securities</h1>
        <p className="text-muted-foreground">
          Lista de títulos e taxas de câmbio com preços atualizados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Títulos e FX Rates</CardTitle>
          <CardDescription>
            Monitorize preços e variações de títulos e taxas de câmbio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecuritiesTable />
        </CardContent>
      </Card>
    </div>
  );
}
