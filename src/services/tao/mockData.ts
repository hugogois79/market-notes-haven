
import { TaoStatsUpdate } from './types';

/**
 * Mock data for fallback when API fails
 */
export const MOCK_TAO_STATS: TaoStatsUpdate = {
  timestamp: new Date().toISOString(),
  price: 228.28,
  market_cap: 1970000000, // $1.97B
  price_change_percentage_24h: -1.03,
  volume_24h: 81390000, // $81.39M
  subnets: Array(92).fill(0).map((_, index) => ({
    netuid: index + 1,
    name: index < 5 ? 
      ["Subnet Alpha", "Subnet Beta", "Subnet Gamma", "Subnet Delta", "Subnet Epsilon"][index] : 
      `Subnet ${index + 1}`,
    neurons: Math.floor(Math.random() * 200) + 20,
    emission: parseFloat((Math.random() * 10).toFixed(4))
  }))
};
