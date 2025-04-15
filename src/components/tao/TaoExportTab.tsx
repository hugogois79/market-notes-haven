
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTaoStats } from '@/services/taoStatsService';
import TaoStatsExport from './TaoStatsExport';
import TaoStatsUpdateComponent from './TaoStatsUpdate';

const TaoExportTab: React.FC = () => {
  const { taoStats, isLoading, error, refreshTaoStats } = useTaoStats();
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading TAO stats...</p>
      </div>
    );
  }
  
  if (error || !taoStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading TAO Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            Failed to load TAO statistics. Please try refreshing the data.
          </p>
          <button 
            onClick={refreshTaoStats}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <TaoStatsUpdateComponent 
          stats={taoStats} 
          isLoading={isLoading} 
          onRefresh={refreshTaoStats} 
        />
        <TaoStatsExport stats={taoStats} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>About TAO Stats Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            TAO Stats are updated automatically every 5 minutes. You can manually refresh 
            the data using the refresh button above.
          </p>
          <p>
            The exported data follows the Tana node format as requested, with the following structure:
          </p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
{`- TAO Stats Update ({{timestamp}}) #[[TAO Update]]
  - Price (USD):: $\{{price_value}}
  - Market Cap (USD):: $\{{market_cap_value}}
  - Subnets:
    - {{name}}
      - ID:: {{netuid}}
      - Neuron Count:: {{neurons}}
      - Emission Rate:: {{emission}} TAO/day`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaoExportTab;
