
import { TaoStatsUpdate } from './types';

/**
 * Mock data for fallback when API fails
 */
export const MOCK_TAO_STATS: TaoStatsUpdate = {
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
