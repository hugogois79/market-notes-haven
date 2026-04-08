
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaoStatsUpdate } from '@/services/taoStatsService';
import { format } from 'date-fns';

interface TaoStatsUpdateProps {
  stats: TaoStatsUpdate;
  isLoading: boolean;
  onRefresh: () => void;
}

const TaoStatsUpdateComponent: React.FC<TaoStatsUpdateProps> = ({
  stats,
  isLoading,
  onRefresh
}) => {
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'PPpp');
    } catch (error) {
      return timestamp;
    }
  };

  // Get just the top 5 subnets by neuron count
  const topSubnets = [...stats.subnets]
    .sort((a, b) => b.neurons - a.neurons)
    .slice(0, 5);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>TAO Stats Update</CardTitle>
        <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Last Update:</div>
          <div className="font-medium">{formatTimestamp(stats.timestamp)}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Price (USD):</div>
            <div className="text-xl font-bold">${stats.price.toFixed(2)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Market Cap (USD):</div>
            <div className="text-xl font-bold">${stats.market_cap.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Top Subnets:</div>
          <div className="border rounded-md divide-y">
            {topSubnets.map((subnet) => (
              <div key={subnet.netuid} className="p-3">
                <div className="font-medium">{subnet.name}</div>
                <div className="grid grid-cols-3 gap-2 mt-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span> {subnet.netuid}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Neurons:</span> {subnet.neurons}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Emission:</span> {typeof subnet.emission === 'number' ? subnet.emission.toFixed(4) : subnet.emission} τ/day
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground mt-2">
          <p>Total Subnets: {stats.subnets.length}</p>
          {stats.volume_24h && (
            <p>24h Volume: ${stats.volume_24h.toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaoStatsUpdateComponent;
