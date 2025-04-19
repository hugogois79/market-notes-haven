
import { API_HEADERS, SUBNETS_URL } from './apiConfig';
import { SubnetPerformance, TaoSubnetInfo } from './types';
import { MOCK_TAO_STATS } from './mockData';
import { SUBNET_NAME_MAPPING } from './subnetMapping';

/**
 * Fetch subnet performance data
 */
export const fetchSubnetPerformance = async (): Promise<TaoSubnetInfo[]> => {
  try {
    console.log('Fetching subnet performance data...');
    const response = await fetch(`${SUBNETS_URL}/performance`, {
      headers: API_HEADERS,
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and map the data with performance information
    return data.map((subnet: any) => {
      // Get the real subnet name if available, otherwise use the mapping
      let subnetName = subnet.name;
      
      if (!subnetName || subnetName.toLowerCase().includes('subnet') || subnetName.toLowerCase() === 'unknown') {
        subnetName = SUBNET_NAME_MAPPING[subnet.netuid] || `Subnet ${subnet.netuid}`;
      }
      
      return {
        netuid: subnet.netuid || 0,
        name: subnetName,
        neurons: subnet.neurons || 0,
        emission: parseFloat(subnet.emission) || 0,
        description: subnet.description || `${subnetName} subnet for the TAO network`,
        tempo: subnet.tempo || 0,
        incentive: subnet.incentive || 0,
        price: typeof subnet.price === 'number' ? subnet.price : parseFloat(subnet.price) || 0,
        market_cap: subnet.market_cap || 0,
        performance: {
          daily_emissions: subnet.daily_emissions || subnet.emission * 24 || 0,
          active_validators: subnet.active_validators || Math.round(subnet.neurons * 0.4) || 0,
          total_stake: subnet.total_stake || Math.round(subnet.neurons * 1000) || 0,
          performance_trend_7d: subnet.performance_trend_7d || (Math.random() * 20 - 10), // Random -10% to +10% if not provided
          updated_at: subnet.updated_at || new Date().toISOString(),
          historical_data: subnet.historical_data || generateMockHistoricalData(7)
        }
      };
    });
  } catch (error) {
    console.error('Error fetching subnet performance:', error);
    
    // Use mock data if the API fails
    return MOCK_TAO_STATS.subnets.map(subnet => {
      return {
        ...subnet,
        name: SUBNET_NAME_MAPPING[subnet.netuid] || `Subnet ${subnet.netuid}`,
        performance: generateMockPerformanceData(subnet.netuid)
      };
    });
  }
};

/**
 * Generate mock historical data for demo purposes
 */
const generateMockHistoricalData = (days: number): SubnetPerformance['historical_data'] => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      timestamp: date.toISOString(),
      emissions: 10 + Math.random() * 5,
      validators: 50 + Math.floor(Math.random() * 20),
      stake: 50000 + Math.floor(Math.random() * 20000)
    });
  }
  
  return data;
};

/**
 * Generate mock performance data for a subnet
 */
const generateMockPerformanceData = (netuid: number): SubnetPerformance => {
  // Create pseudo-random but consistent data based on netuid
  const seed = netuid * 17 % 100;
  const trendDirection = (netuid % 3) - 1; // -1, 0, or 1
  
  return {
    daily_emissions: 10 + (seed / 10),
    active_validators: 30 + (seed % 50),
    total_stake: 30000 + (seed * 1000),
    performance_trend_7d: trendDirection * (2 + (seed % 8)),
    updated_at: new Date().toISOString(),
    historical_data: generateMockHistoricalData(7)
  };
};

/**
 * Hook to use subnet performance data with automatic refreshing
 */
export const useSubnetPerformance = (refreshInterval = 30 * 60 * 1000) => {
  const [performanceData, setPerformanceData] = React.useState<TaoSubnetInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  
  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchSubnetPerformance();
      setPerformanceData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch performance data'));
      console.error('Error in useSubnetPerformance:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial fetch
  React.useEffect(() => {
    fetchData();
    
    // Set up interval for automatic refreshing
    const intervalId = setInterval(fetchData, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchData, refreshInterval]);
  
  return {
    performanceData,
    isLoading,
    error,
    lastUpdated,
    refreshData: fetchData
  };
};
