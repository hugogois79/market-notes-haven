
import { useState, useEffect } from 'react';
import { fetchTaoStatsUpdate, TaoStatsUpdate } from './taoStatsService';

export function useTaoStats(refreshInterval = 300000) { // Default 5min refresh interval
  const [taoStats, setTaoStats] = useState<TaoStatsUpdate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const refreshTaoStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Refreshing TAO stats data...');
      
      const stats = await fetchTaoStatsUpdate();
      
      // Check if we're using mock data by seeing if our timestamp matches
      // the current time vs. the timestamp in the mock data
      const currentTime = new Date().getTime();
      const dataTime = new Date(stats.timestamp).getTime();
      const isUsingMockData = Math.abs(currentTime - dataTime) > 60000; // More than a minute difference
      
      setTaoStats(stats);
      setIsMockData(isUsingMockData);
      setLastRefreshTime(new Date());
      console.log('TAO stats refreshed successfully');
      console.log('Using mock data:', isUsingMockData);
      
    } catch (err) {
      console.error('Error refreshing TAO stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch TAO stats'));
      setIsMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTaoStats();
    
    const intervalId = setInterval(() => {
      refreshTaoStats();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return {
    taoStats,
    isLoading,
    error,
    refreshTaoStats,
    isMockData,
    lastRefreshTime
  };
}
