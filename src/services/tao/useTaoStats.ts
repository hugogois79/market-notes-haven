
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TaoStatsUpdate } from './types';
import { fetchTaoStatsUpdate } from './taoStatsService';
import { MOCK_TAO_STATS } from './mockData';

/**
 * Custom hook for live-updating TAO stats
 */
export const useTaoStats = (refreshInterval = 5 * 60 * 1000) => {
  const queryClient = useQueryClient();
  
  // Set up automatic refetching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tao-stats-update'],
    queryFn: () => fetchTaoStatsUpdate(true), // Use mock data on failure
    refetchInterval: refreshInterval,
    staleTime: refreshInterval - 1000,
    retry: 2, // Increased retries
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
    isMockData: !data && !!error
  };
};
