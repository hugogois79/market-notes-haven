import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Coins, SplitSquareVertical, ArrowRightLeft, Receipt } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type Movement = {
  id: string;
  holding_id: string;
  movement_type: string;
  movement_date: string;
  quantity: number | null;
  price_per_unit: number | null;
  total_value: number;
  currency: string;
  notes: string | null;
  created_at: string;
};

type Holding = {
  id: string;
  name: string;
  ticker: string | null;
};

const formatCurrency = (value: number, currency: string = "EUR") => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency === "USDT" || currency === "BTC" ? "USD" : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const MOVEMENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  buy: { label: "Compra", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: ArrowDownCircle },
  sell: { label: "Venda", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: ArrowUpCircle },
  dividend: { label: "Dividendo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Coins },
  split: { label: "Split", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: SplitSquareVertical },
  transfer_in: { label: "Transferência In", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: ArrowRightLeft },
  transfer_out: { label: "Transferência Out", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: ArrowRightLeft },
  fee: { label: "Comissão", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: Receipt },
};

export default function MarketMovementHistory() {
  const [filterHolding, setFilterHolding] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["market-movements-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_movements")
        .select("*")
        .order("movement_date", { ascending: false });
      if (error) throw error;
      return data as Movement[];
    },
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ["market-holdings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_holdings")
        .select("id, name, ticker")
        .order("name");
      if (error) throw error;
      return data as Holding[];
    },
  });

  const holdingsMap = holdings.reduce((acc, h) => {
    acc[h.id] = h;
    return acc;
  }, {} as Record<string, Holding>);

  const filtered = movements.filter((m) => {
    if (filterHolding !== "all" && m.holding_id !== filterHolding) return false;
    if (filterType !== "all" && m.movement_type !== filterType) return false;
    return true;
  });

  // Summary stats
  const totalBuys = filtered.filter(m => m.movement_type === "buy").reduce((s, m) => s + m.total_value, 0);
  const totalSells = filtered.filter(m => m.movement_type === "sell").reduce((s, m) => s + m.total_value, 0);
  const totalDividends = filtered.filter(m => m.movement_type === "dividend").reduce((s, m) => s + m.total_value, 0);
  const totalFees = filtered.filter(m => m.movement_type === "fee").reduce((s, m) => s + m.total_value, 0);
  const netFlow = totalSells + totalDividends - totalBuys - totalFees;

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar movimentos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Compras</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(totalBuys)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Vendas</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(totalSells)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Dividendos</p>
          <p className="text-lg font-semibold text-blue-600">{formatCurrency(totalDividends)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Comissões</p>
          <p className="text-lg font-semibold text-gray-600">{formatCurrency(totalFees)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Fluxo Líquido</p>
          <p className={`text-lg font-semibold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netFlow)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterHolding} onValueChange={setFilterHolding}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por holding" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os holdings</SelectItem>
            {holdings.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name} {h.ticker ? `(${h.ticker})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de movimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(MOVEMENT_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground self-center ml-auto">
          {filtered.length} movimento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Movements Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Holding</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Preço Unit.</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Sem movimentos registados.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const config = MOVEMENT_TYPE_CONFIG[m.movement_type] || MOVEMENT_TYPE_CONFIG.fee;
                const holding = holdingsMap[m.holding_id];
                const Icon = config.icon;

                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">
                      {format(new Date(m.movement_date), "dd MMM yyyy", { locale: pt })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${config.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {holding?.name || '—'}
                      {holding?.ticker && (
                        <span className="text-xs text-muted-foreground ml-1">({holding.ticker})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {m.quantity != null ? m.quantity.toLocaleString("pt-PT") : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {m.price_per_unit != null ? formatCurrency(m.price_per_unit, m.currency) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(m.total_value, m.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{m.currency}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {m.notes || '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
