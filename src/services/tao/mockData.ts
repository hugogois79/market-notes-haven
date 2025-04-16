
import { TaoStatsUpdate } from './types';
import { SUBNET_NAME_MAPPING } from './subnetMapping';

/**
 * Mock data for fallback when API fails
 * Updated with real subnet names from the SUBNET_NAME_MAPPING
 */
export const MOCK_TAO_STATS: TaoStatsUpdate = {
  timestamp: new Date().toISOString(),
  price: 228.78,
  market_cap: 1970000000, // $1.97B
  price_change_percentage_24h: -0.96,
  volume_24h: 81390000, // $81.39M
  subnets: Array(92).fill(0).map((_, index) => {
    const netuid = index;
    // Use the real subnet names from the mapping or generate a default
    const name = SUBNET_NAME_MAPPING[netuid] || `Subnet ${netuid}`;
    
    return {
      netuid,
      name,
      neurons: Math.floor(Math.random() * 200) + 20,
      emission: parseFloat((Math.random() * 10).toFixed(4)),
      description: `${name} subnet for the TAO network`,
      tempo: Math.floor(Math.random() * 100),
      incentive: Math.floor(Math.random() * 1000),
      price: parseFloat((Math.random() * 0.5).toFixed(6)),
      market_cap: Math.floor(Math.random() * 300000) + 10000,
      volume_24h: Math.floor(Math.random() * 100000) + 5000,
      price_change_1h: parseFloat((Math.random() * 10 - 5).toFixed(2)),
      price_change_24h: parseFloat((Math.random() * 30 - 15).toFixed(2)),
      price_change_7d: parseFloat((Math.random() * 60 - 20).toFixed(2))
    };
  })
};
