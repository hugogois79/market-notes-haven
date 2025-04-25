
/**
 * API configuration for TAO services
 */

// TaoStats API configuration
export const API_KEY = 'tao-a29151e1-e395-4ed0-ae18-376839738c0c:bcebc240';
export const API_HEADERS = {
  'Authorization': API_KEY,
  'accept': 'application/json'
};

// TaoStats API endpoints
export const GLOBAL_STATS_URL = 'https://api.taostats.io/v1/stats/latest';
export const SUBNETS_URL = 'https://api.taostats.io/v1/subnets';

// CoinGecko API configuration
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const BITTENSOR_ID = 'bittensor'; // CoinGecko ID for Bittensor
