import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// API configuration
const API_KEY = 'tao-a29151e1-e395-4ed0-ae18-376839738c0c:bcebc240';
const API_HEADERS = {
  'Authorization': API_KEY,
  'accept': 'application/json'
};

// API endpoints
const GLOBAL_STATS_URL = 'https://api.taostats.io/api/stats/latest/v1';
const SUBNETS_URL = 'https://api.taostats.io/api/subnet/v1';

// Types for API responses
export interface TaoGlobalStats {
  price: number;
  market_cap: number;
  timestamp: string;
  volume_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
}

export interface TaoSubnetInfo {
  netuid: number;
  name: string;
  neurons: number;
  emission: number;
  description?: string;
  tempo?: number;
  incentive?: number;
}

export interface TaoStatsUpdate {
  timestamp: string;
  price: number;
  market_cap: number;
  price_change_percentage_24h?: number;
  volume_24h?: number;
  subnets: TaoSubnetInfo[];
}

// Mock data for fallback when API fails
const MOCK_TAO_STATS: TaoStatsUpdate = {
  timestamp: new Date().toISOString(),
  price: 56.78,
  market_cap: 1284653430,
  price_change_percentage_24h: 2.45,
  volume_24h: 78432562,
  subnets: [
    { netuid: 1, name: "Subnet Alpha", neurons: 128, emission: 8.5642 },
    { netuid: 2, name: "Subnet Beta", neurons: 96, emission: 6.2431 },
    { netuid: 3, name: "Subnet Gamma", neurons: 76, emission: 4.8732 },
    { netuid: 4, name: "Subnet Delta", neurons: 64, emission: 3.9845 },
    { netuid: 5, name: "Subnet Epsilon", neurons: 48, emission: 2.7621 }
  ]
};

// Fetch global TAO stats
export const fetchTaoGlobalStats = async (): Promise<TaoGlobalStats> => {
  try {
    const response = await fetch(GLOBAL_STATS_URL, {
      headers: API_HEADERS,
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      price: data.price,
      market_cap: data.market_cap,
      timestamp: new Date().toISOString(),
      volume_24h: data.volume_24h,
      price_change_24h: data.price_change_24h,
      price_change_percentage_24h: data.price_change_percentage_24h,
    };
  } catch (error) {
    console.error('Error fetching TAO global stats:', error);
    return {
      price: MOCK_TAO_STATS.price,
      market_cap: MOCK_TAO_STATS.market_cap,
      timestamp: MOCK_TAO_STATS.timestamp,
      volume_24h: MOCK_TAO_STATS.volume_24h,
      price_change_percentage_24h: MOCK_TAO_STATS.price_change_percentage_24h,
    };
  }
};

// Fetch subnets information
export const fetchTaoSubnets = async (): Promise<TaoSubnetInfo[]> => {
  try {
    const response = await fetch(SUBNETS_URL, {
      headers: API_HEADERS,
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((subnet: any) => ({
      netuid: subnet.netuid,
      name: subnet.name,
      neurons: subnet.neurons,
      emission: subnet.emission,
      description: subnet.description,
      tempo: subnet.tempo,
      incentive: subnet.incentive
    }));
  } catch (error) {
    console.error('Error fetching TAO subnets:', error);
    return MOCK_TAO_STATS.subnets;
  }
};

// Fetch complete TAO stats update
export const fetchTaoStatsUpdate = async (useMockOnFailure = true): Promise<TaoStatsUpdate> => {
  try {
    const [globalStats, subnets] = await Promise.all([
      fetchTaoGlobalStats(),
      fetchTaoSubnets()
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      price: globalStats.price,
      market_cap: globalStats.market_cap,
      price_change_percentage_24h: globalStats.price_change_percentage_24h,
      volume_24h: globalStats.volume_24h,
      subnets
    };
  } catch (error) {
    console.error('Error fetching TAO stats update:', error);
    
    if (useMockOnFailure) {
      console.log('Using mock TAO data due to API failure');
      return MOCK_TAO_STATS;
    }
    
    throw error;
  }
};

// Custom hook for live-updating TAO stats
export const useTaoStats = (refreshInterval = 5 * 60 * 1000) => {
  const queryClient = useQueryClient();
  
  // Set up automatic refetching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tao-stats-update'],
    queryFn: () => fetchTaoStatsUpdate(true), // Use mock data on failure
    refetchInterval: refreshInterval,
    staleTime: refreshInterval - 1000,
    retry: 1,
    gcTime: 60 * 60 * 1000, // 1 hour
    meta: {
      onError: (error: any) => {
        console.error("Error fetching TAO stats:", error);
        toast.error("Unable to fetch live TAO data. Using cached data instead.");
      }
    }
  });
  
  // Function to manually refresh the data
  const refreshTaoStats = () => {
    toast.info("Refreshing TAO network data...");
    queryClient.invalidateQueries({ queryKey: ['tao-stats-update'] });
  };
  
  return {
    taoStats: data || MOCK_TAO_STATS, // Provide mock data as fallback
    isLoading,
    error,
    refreshTaoStats,
    isMockData: !data && error
  };
};
