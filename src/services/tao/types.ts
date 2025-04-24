
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
  emission: number | string;  // Updated to allow both number and string
  description?: string;
  tempo?: number;
  incentive?: number;
  // Price and market data fields
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_1h?: number;
  price_change_24h?: number;
  price_change_7d?: number;
  // Performance data
  performance?: SubnetPerformance;
}

// Subnet performance data
export interface SubnetPerformance {
  daily_emissions: number;
  active_validators: number;
  total_stake: number;
  performance_trend_7d: number; // Percentage change in the last 7 days
  updated_at: string;
  historical_data?: HistoricalPerformancePoint[];
}

// Historical performance data point
export interface HistoricalPerformancePoint {
  timestamp: string;
  emissions: number;
  validators: number;
  stake: number;
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

// TAO validator information for the validators tab
export interface TaoValidator {
  rank?: number;
  name: string;
  stake?: number;
  delegation?: number; 
  uptime?: number;
  status?: 'active' | 'jailed' | 'inactive';
}

// Performance alert settings
export interface PerformanceAlertSettings {
  enabled: boolean;
  thresholds: {
    emissions_drop: number;  // Percentage
    validator_drop: number;  // Percentage
    stake_drop: number;      // Percentage
  };
  notification_methods: {
    email: boolean;
    browser: boolean;
    telegram?: boolean;
  };
  custom_metrics: CustomMetricTracking[];
}

// Custom metric tracking
export interface CustomMetricTracking {
  id: string;
  name: string;
  metric: 'emissions' | 'validators' | 'stake' | 'performance';
  condition: 'above' | 'below' | 'change';
  value: number;
  enabled: boolean;
}
