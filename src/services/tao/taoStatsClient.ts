
import { API_HEADERS, GLOBAL_STATS_URL, SUBNETS_URL } from './apiConfig';
import { TaoGlobalStats, TaoSubnetInfo } from './types';
import { fetchTaoPriceFromCoinGecko } from './coinGeckoClient';
import { MOCK_TAO_STATS } from './mockData';

/**
 * Fetch global TAO stats, attempting CoinGecko first, then TaoStats API
 */
export const fetchTaoGlobalStats = async (): Promise<TaoGlobalStats> => {
  try {
    // First try CoinGecko
    try {
      const coinGeckoData = await fetchTaoPriceFromCoinGecko();
      return {
        ...coinGeckoData,
        timestamp: new Date().toISOString(),
      };
    } catch (coinGeckoError) {
      console.warn('CoinGecko API failed, trying primary API:', coinGeckoError);
      
      // If CoinGecko fails, try the original API
      const response = await fetch(GLOBAL_STATS_URL, {
        headers: API_HEADERS,
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`Primary API error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        price: data.price,
        market_cap: data.market_cap,
        timestamp: new Date().toISOString(),
        volume_24h: data.volume_24h,
        price_change_24h: data.price_change_24h,
        price_change_percentage_24h: data.price_change_percentage_24h,
      };
    }
  } catch (error) {
    console.error('All TAO price APIs failed:', error);
    return {
      price: MOCK_TAO_STATS.price,
      market_cap: MOCK_TAO_STATS.market_cap,
      timestamp: MOCK_TAO_STATS.timestamp,
      volume_24h: MOCK_TAO_STATS.volume_24h,
      price_change_percentage_24h: MOCK_TAO_STATS.price_change_percentage_24h,
    };
  }
};

/**
 * Mapping of known subnet IDs to their real names
 * Based on data from taostats.io
 */
const SUBNET_NAME_MAPPING: Record<number, string> = {
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
 * Fetch subnets information
 */
export const fetchTaoSubnets = async (): Promise<TaoSubnetInfo[]> => {
  try {
    const response = await fetch(SUBNETS_URL, {
      headers: API_HEADERS,
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((subnet: any) => {
      // Get the real subnet name if available, otherwise use the generic name
      let subnetName = subnet.name;
      
      // If the API doesn't provide a name or it's generic, use our mapping
      if (!subnetName || subnetName.toLowerCase().includes('subnet')) {
        subnetName = SUBNET_NAME_MAPPING[subnet.netuid] || `Subnet ${subnet.netuid}`;
      }
      
      return {
        netuid: subnet.netuid,
        name: subnetName,
        neurons: subnet.neurons,
        emission: subnet.emission,
        description: subnet.description,
        tempo: subnet.tempo,
        incentive: subnet.incentive
      };
    });
  } catch (error) {
    console.error('Error fetching TAO subnets:', error);
    
    // If the API fails, use our mock data but with real subnet names where possible
    return MOCK_TAO_STATS.subnets.map(subnet => {
      return {
        ...subnet,
        name: SUBNET_NAME_MAPPING[subnet.netuid] || `Subnet ${subnet.netuid}`
      };
    });
  }
};
