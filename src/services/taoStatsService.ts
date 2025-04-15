
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  subnets: TaoSubnetInfo[];
}

// Fetch global TAO stats
export const fetchTaoGlobalStats = async (): Promise<TaoGlobalStats> => {
  try {
    const response = await fetch(GLOBAL_STATS_URL, {
      headers: API_HEADERS
    });
    
    if (!response.ok) {
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
    throw error;
  }
};

// Fetch subnets information
export const fetchTaoSubnets = async (): Promise<TaoSubnetInfo[]> => {
  try {
    const response = await fetch(SUBNETS_URL, {
      headers: API_HEADERS
    });
    
    if (!response.ok) {
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
    throw error;
  }
};

// Fetch complete TAO stats update
export const fetchTaoStatsUpdate = async (): Promise<TaoStatsUpdate> => {
  try {
    const [globalStats, subnets] = await Promise.all([
      fetchTaoGlobalStats(),
      fetchTaoSubnets()
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      price: globalStats.price,
      market_cap: globalStats.market_cap,
      subnets
    };
  } catch (error) {
    console.error('Error fetching TAO stats update:', error);
    throw error;
  }
};

// Custom hook for live-updating TAO stats
export const useTaoStats = (refreshInterval = 5 * 60 * 1000) => {
  const queryClient = useQueryClient();
  
  // Set up automatic refetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['tao-stats-update'],
    queryFn: fetchTaoStatsUpdate,
    refetchInterval: refreshInterval,
    staleTime: refreshInterval - 1000,
  });
  
  // Function to manually refresh the data
  const refreshTaoStats = () => {
    queryClient.invalidateQueries({ queryKey: ['tao-stats-update'] });
  };
  
  return {
    taoStats: data,
    isLoading,
    error,
    refreshTaoStats
  };
};
