import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  type: 'forex' | 'crypto';
}

const mockTickers: TickerItem[] = [
  { symbol: 'EUR/USD', price: 1.0842, change: 0.12, type: 'forex' },
  { symbol: 'EUR/CHF', price: 0.9412, change: -0.08, type: 'forex' },
  { symbol: 'EUR/GBP', price: 0.8534, change: 0.05, type: 'forex' },
  { symbol: 'BTC', price: 42850.00, change: 2.34, type: 'crypto' },
  { symbol: 'ETH', price: 2280.50, change: -1.12, type: 'crypto' },
];

const TickerTape = () => {
  const [tickers, setTickers] = useState<TickerItem[]>(mockTickers);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((ticker) => ({
          ...ticker,
          price: ticker.price * (1 + (Math.random() - 0.5) * 0.001),
          change: ticker.change + (Math.random() - 0.5) * 0.1,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const duplicatedTickers = [...tickers, ...tickers, ...tickers];

  return (
    <div className="bg-slate-900 text-white overflow-hidden border-b border-slate-800">
      <div
        className="flex items-center gap-8 py-2 px-4 whitespace-nowrap"
        style={{
          transform: `translateX(-${offset}%)`,
          transition: 'transform 0.05s linear',
        }}
      >
        {duplicatedTickers.map((ticker, index) => (
          <div key={`${ticker.symbol}-${index}`} className="flex items-center gap-2 font-mono text-sm">
            <span className="text-slate-400">{ticker.symbol}</span>
            <span className="font-semibold">
              {ticker.type === 'crypto' 
                ? `€${ticker.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : ticker.price.toFixed(4)
              }
            </span>
            <span className={cn(
              "flex items-center gap-0.5 text-xs",
              ticker.change >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {ticker.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerTape;
