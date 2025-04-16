
import { TaoGlobalStats, TaoStatsUpdate, TaoSubnetInfo } from './types';
import { fetchTaoGlobalStats, fetchTaoSubnets } from './taoStatsClient';
import { MOCK_TAO_STATS } from './mockData';

/**
 * Fetch complete TAO stats update
 */
export const fetchTaoStatsUpdate = async (useMockOnFailure = true): Promise<TaoStatsUpdate> => {
  try {
    console.log('Fetching TAO stats update...');
    const [globalStats, subnets] = await Promise.all([
      fetchTaoGlobalStats(),
      fetchTaoSubnets()
    ]);
    
    console.log('Received global stats:', globalStats);
    console.log('Received subnets data:', subnets);
    
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

// Re-export everything from types for backward compatibility
export * from './types';
export * from './mockData';
