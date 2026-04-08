
import { useState, useEffect, useCallback } from 'react';
import { fetchTaoStatsUpdate, TaoStatsUpdate } from './taoStatsService';
import { toast } from 'sonner';

export function useTaoStats(refreshInterval = 300000) { // Default 5min refresh interval
  const [taoStats, setTaoStats] = useState<TaoStatsUpdate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshTaoStats = useCallback(async (showToast = true) => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      if (isLoading === false) {
        setIsLoading(true);
      }
      setError(null);
      
      if (showToast) {
        console.log('Refreshing TAO stats data...');
      }
      
      const stats = await fetchTaoStatsUpdate();
      
      // Check if we're using mock data by comparing timestamps
      const currentTime = new Date().getTime();
      const dataTime = new Date(stats.timestamp).getTime();
      const isUsingMockData = Math.abs(currentTime - dataTime) > 60000; // More than a minute difference
      
      // Validate subnets data
      if (!stats.subnets || stats.subnets.length === 0) {
        console.warn('Received empty subnets array from API');
      }
      
      setTaoStats(stats);
      setIsMockData(isUsingMockData);
      setLastRefreshTime(new Date());
      
      if (showToast) {
        console.log('TAO stats refreshed successfully');
        console.log('Using mock data:', isUsingMockData);
      }
      
    } catch (err) {
      console.error('Error refreshing TAO stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch TAO stats'));
      setIsMockData(true);
      
      if (showToast) {
        toast.error('Failed to refresh TAO network data');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isLoading, isRefreshing]);

  // Manual refresh function that shows feedback
  const manualRefresh = useCallback(() => {
    toast.info('Refreshing TAO network data...');
    return refreshTaoStats(true);
  }, [refreshTaoStats]);

  useEffect(() => {
    // Initial load
    refreshTaoStats(false);
    
    // Set up interval for periodic refresh
    const intervalId = setInterval(() => {
      refreshTaoStats(false);
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, refreshTaoStats]);

  return {
    taoStats,
    isLoading,
    error,
    refreshTaoStats: manualRefresh,
    isMockData,
    lastRefreshTime
  };
}
