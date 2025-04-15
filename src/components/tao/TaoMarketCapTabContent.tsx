
import React from "react";

const TaoMarketCapTabContent: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price (USD)</span>
            <span className="font-bold">$56.78</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Market Cap</span>
            <span className="font-bold">$1,284,653,430</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">24h Volume</span>
            <span className="font-bold">$78,432,562</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">24h High</span>
            <span className="font-bold">$58.24</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">24h Low</span>
            <span className="font-bold">$54.95</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">All-time High</span>
            <span className="font-bold">$89.32</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Exchange Distribution</h2>
        <div className="space-y-3">
          {[
            { exchange: "Binance", volume: "$32M", percentage: 45 },
            { exchange: "Coinbase", volume: "$18M", percentage: 25 },
            { exchange: "Kraken", volume: "$11M", percentage: 15 },
            { exchange: "KuCoin", volume: "$7M", percentage: 10 },
            { exchange: "Others", volume: "$3M", percentage: 5 },
          ].map((item) => (
            <div key={item.exchange} className="space-y-1">
              <div className="flex justify-between">
                <span>{item.exchange}</span>
                <span>{item.volume}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-brand h-2 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaoMarketCapTabContent;
