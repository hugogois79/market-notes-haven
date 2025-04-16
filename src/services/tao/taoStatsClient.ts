
import { API_HEADERS, GLOBAL_STATS_URL, SUBNETS_URL } from './apiConfig';
import { TaoGlobalStats, TaoSubnetInfo } from './types';
import { fetchTaoPriceFromCoinGecko } from './coinGeckoClient';
import { MOCK_TAO_STATS } from './mockData';
import { SUBNET_NAME_MAPPING } from './subnetMapping';

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
 * Fetch subnets information with real names
 */
export const fetchTaoSubnets = async (): Promise<TaoSubnetInfo[]> => {
  try {
    console.log('Fetching TAO subnets from API...');
    const response = await fetch(SUBNETS_URL, {
      headers: API_HEADERS,
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('TAO subnets API response:', data);
    
    // Process and map the data
    return data.map((subnet: any) => {
      // Get the real subnet name if available, otherwise use the mapping
      let subnetName = subnet.name;
      
      // If the API doesn't provide a meaningful name or it's generic, use our mapping
      if (!subnetName || 
          subnetName.toLowerCase().includes('subnet') || 
          subnetName.toLowerCase() === 'unknown') {
        subnetName = SUBNET_NAME_MAPPING[subnet.netuid] || `Subnet ${subnet.netuid}`;
      }
      
      // Make sure all required fields have valid values
      return {
        netuid: subnet.netuid || 0,
        name: subnetName,
        neurons: subnet.neurons || 0,
        emission: parseFloat(subnet.emission) || 0,
        description: subnet.description || `${subnetName} subnet for the TAO network`,
        tempo: subnet.tempo || 0,
        incentive: subnet.incentive || 0,
        // Add price-related fields that might be available in the API
        price: typeof subnet.price === 'number' ? subnet.price : parseFloat(subnet.price) || 0,
        market_cap: subnet.market_cap || 0,
        volume_24h: subnet.volume_24h || 0,
        price_change_1h: subnet.price_change_1h || 0,
        price_change_24h: subnet.price_change_24h || 0,
        price_change_7d: subnet.price_change_7d || 0
      };
    });
  } catch (error) {
    console.error('Error fetching TAO subnets:', error);
    
    // If the API fails, use our mock data but with real subnet names
    console.log('Using mock subnet data with real names');
    return MOCK_TAO_STATS.subnets.map(subnet => {
      return {
        ...subnet,
        name: SUBNET_NAME_MAPPING[subnet.netuid] || `Subnet ${subnet.netuid}`
      };
    });
  }
};
