
import { TaoStatsUpdate } from './types';

/**
 * Mapping of known subnet IDs to their real names
 * Based on data from taostats.io
 */
const REAL_SUBNET_NAMES: Record<number, string> = {
  1: "Alpha",
  6: "Core Validator",
  7: "Attestation",
  18: "Zeus",
  19: "Storyteller",
  22: "Miner",
  62: "Yuma",
  63: "Logistics",
  81: "Text",
  85: "Improvement",
  88: "Cortex",
  // Add more as they become known
};

/**
 * Mock data for fallback when API fails
 */
export const MOCK_TAO_STATS: TaoStatsUpdate = {
  timestamp: new Date().toISOString(),
  price: 228.78,
  market_cap: 1970000000, // $1.97B
  price_change_percentage_24h: -0.96,
  volume_24h: 81390000, // $81.39M
  subnets: Array(92).fill(0).map((_, index) => {
    const netuid = index + 1;
    return {
      netuid,
      name: REAL_SUBNET_NAMES[netuid] || `Subnet ${netuid}`,
      neurons: Math.floor(Math.random() * 200) + 20,
      emission: parseFloat((Math.random() * 10).toFixed(4))
    };
  })
};
