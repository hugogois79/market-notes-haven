
/**
 * API configuration for TAO services
 * Now uses secure edge function proxy to protect API keys
 */

// Supabase edge function proxy URL
const SUPABASE_URL = 'https://zyziolikudoczsthyoja.supabase.co';
export const TAO_STATS_PROXY_URL = `${SUPABASE_URL}/functions/v1/tao-stats-proxy`;

// TaoStats API endpoints (used as parameters to the proxy)
export const GLOBAL_STATS_ENDPOINT = '/stats/latest';
export const SUBNETS_ENDPOINT = '/subnets';
export const VALIDATORS_ENDPOINT = '/validators';
export const NETWORK_METRICS_ENDPOINT = '/network/metrics';

// CoinGecko API configuration (public API, no authentication needed)
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const BITTENSOR_ID = 'bittensor'; // CoinGecko ID for Bittensor

// API request timeout in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds
