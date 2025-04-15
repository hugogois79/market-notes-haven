
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
          <div className="text-sm text-muted-foreground">Subnets:</div>
          <div className="border rounded-md divide-y">
            {stats.subnets.map((subnet) => (
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
                    <span className="text-muted-foreground">Emission:</span> {subnet.emission.toFixed(4)} τ/day
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaoStatsUpdateComponent;
