
/**
 * Re-export from refactored files for backward compatibility
 * This maintains the same public API while using the refactored implementation
 */

export { fetchTaoStatsUpdate, TaoGlobalStats, TaoSubnetInfo, TaoStatsUpdate } from './tao/taoStatsService';
export { useTaoStats } from './tao/useTaoStats';
export { MOCK_TAO_STATS } from './tao/mockData';
export { fetchTaoGlobalStats, fetchTaoSubnets } from './tao/taoStatsClient';
