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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type Security = {
  id: string;
  name: string;
  ticker: string | null;
  isin: string | null;
  currency: string | null;
  created_at: string;
};

type StockPrice = {
  symbol: string;
  current_price: number;
  previous_close: number | null;
  change: number | null;
  change_percent: string | null;
  latest_trading_day: string;
  fetched_at: string;
};

const formatCurrency = (value: number, currency: string = "EUR") => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency === "BTC" || currency === "USDT" ? "USD" : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(value);
};

export default function SecuritiesTable() {
  // Fetch securities
  const { data: securities = [], isLoading: loadingSecurities } = useQuery({
    queryKey: ["securities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("securities")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Security[];
    },
  });

  // Fetch stock prices for all symbols
  const { data: stockPrices = [], isLoading: loadingPrices, dataUpdatedAt } = useQuery({
    queryKey: ["stock-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_prices")
        .select("*")
        .order("symbol");
      if (error) throw error;
      return data as StockPrice[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Create a map of ticker -> price data
  const priceMap = stockPrices.reduce((acc, price) => {
    acc[price.symbol] = price;
    return acc;
  }, {} as Record<string, StockPrice>);

  // Merge securities with their prices
  const securitiesWithPrices = securities.map((sec) => {
    const price = sec.ticker ? priceMap[sec.ticker] : null;
    return {
      ...sec,
      price,
    };
  });

  // Also show FX rates (EUR* symbols)
  const fxRates = stockPrices.filter((p) => p.symbol.startsWith("EUR"));

  const isLoading = loadingSecurities || loadingPrices;

  return (
    <div className="space-y-6">
      {/* FX Rates Section */}
      {fxRates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Taxas de Câmbio</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {fxRates.map((fx) => {
              const currency = fx.symbol.replace("EUR", "");
              const changeNum = parseFloat(fx.change_percent?.replace("%", "") || "0");
              return (
                <div
                  key={fx.symbol}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{currency}</span>
                    <Badge variant="outline" className="text-xs">
                      FX
                    </Badge>
                  </div>
                  <div className="text-lg font-bold">
                    {fx.current_price.toFixed(4)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {changeNum > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : changeNum < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={changeNum > 0 ? "text-green-500" : changeNum < 0 ? "text-red-500" : "text-muted-foreground"}>
                      {fx.change_percent || "0%"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Securities Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Títulos</h3>
          {dataUpdatedAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Atualizado: {format(new Date(dataUpdatedAt), "HH:mm", { locale: pt })}
            </span>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead>Moeda</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">Última Atualização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    A carregar...
                  </TableCell>
                </TableRow>
              ) : securitiesWithPrices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum título registado
                  </TableCell>
                </TableRow>
              ) : (
                securitiesWithPrices.map((sec) => {
                  const changeNum = sec.price ? parseFloat(sec.price.change_percent?.replace("%", "") || "0") : 0;
                  return (
                    <TableRow key={sec.id}>
                      <TableCell className="font-medium">{sec.name}</TableCell>
                      <TableCell>
                        {sec.ticker ? (
                          <Badge variant="outline">{sec.ticker}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {sec.isin || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sec.currency || "EUR"}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {sec.price ? (
                          formatCurrency(sec.price.current_price, sec.currency || "EUR")
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {sec.price ? (
                          <div className="flex items-center justify-end gap-1">
                            {changeNum > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : changeNum < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={changeNum > 0 ? "text-green-500" : changeNum < 0 ? "text-red-500" : "text-muted-foreground"}>
                              {sec.price.change_percent || "0%"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {sec.price ? (
                          format(new Date(sec.price.fetched_at), "dd/MM/yyyy HH:mm", { locale: pt })
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
