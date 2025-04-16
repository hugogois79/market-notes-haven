
/**
 * Type definitions for TAO-related data structures
 */

// TAO price and market statistics
export interface TaoGlobalStats {
  price: number;
  market_cap: number;
  timestamp: string;
  volume_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
}

// TAO subnet information
export interface TaoSubnetInfo {
  netuid: number;
  name: string;
  neurons: number;
  emission: number;
  description?: string;
  tempo?: number;
  incentive?: number;
}

// Combined TAO network statistics
export interface TaoStatsUpdate {
  timestamp: string;
  price: number;
  market_cap: number;
  price_change_percentage_24h?: number;
  volume_24h?: number;
  subnets: TaoSubnetInfo[];
}
