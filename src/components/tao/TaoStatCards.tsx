
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, Layers, PieChart, ArrowUp, ArrowDown } from "lucide-react";
import { TaoStatsUpdate } from "@/services/taoStatsService";

interface TaoStatCardsProps {
  taoStats?: TaoStatsUpdate;
  subnetCount: number;
}

const TaoStatCards: React.FC<TaoStatCardsProps> = ({ taoStats, subnetCount }) => {
  // Format large numbers
  const formatNumber = (num: number | undefined, decimals = 2): string => {
    if (num === undefined) return 'N/A';
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(decimals)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(decimals)}K`;
    } else {
      return `$${num.toFixed(decimals)}`;
    }
  };

  const hasLiveData = !!taoStats;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">TAO Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {hasLiveData ? `$${taoStats.price.toFixed(2)}` : '$--.--.--'}
              </div>
              {hasLiveData && taoStats.price_change_percentage_24h && (
                <div className={`flex items-center text-xs ${
                  (taoStats.price_change_percentage_24h || 0) >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {(taoStats.price_change_percentage_24h || 0) >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs((taoStats.price_change_percentage_24h || 0)).toFixed(2)}% (24h)
                </div>
              )}
            </div>
            <CircleDollarSign className="text-brand h-8 w-8 opacity-20" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {hasLiveData ? formatNumber(taoStats.market_cap) : '$-.--B'}
            </div>
            <PieChart className="text-brand h-8 w-8 opacity-20" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active Subnets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {subnetCount}
            </div>
            <Layers className="text-brand h-8 w-8 opacity-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaoStatCards;
