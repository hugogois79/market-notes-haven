
import { TAO_STATS_PROXY_URL, GLOBAL_STATS_ENDPOINT, SUBNETS_ENDPOINT } from './apiConfig';
import { TaoGlobalStats, TaoSubnetInfo } from './types';
import { fetchTaoPriceFromCoinGecko } from './coinGeckoClient';
import { MOCK_TAO_STATS } from './mockData';
import { SUBNET_NAME_MAPPING } from './subnetMapping';
import { supabase } from '@/integrations/supabase/client';

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
      console.warn('CoinGecko API failed, trying TaoStats via proxy:', coinGeckoError);
      
      // If CoinGecko fails, try TaoStats via secure proxy
      const { data, error } = await supabase.functions.invoke('tao-stats-proxy', {
        body: { endpoint: GLOBAL_STATS_ENDPOINT }
      });
      
      if (error) {
        throw new Error(`TaoStats proxy error: ${error.message}`);
      }
      
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
 * Fetch subnets information with real names and detailed data
 */
export const fetchTaoSubnets = async (): Promise<TaoSubnetInfo[]> => {
  try {
    console.log('Fetching TAO subnets via secure proxy...');
    
    const { data, error } = await supabase.functions.invoke('tao-stats-proxy', {
      body: { endpoint: SUBNETS_ENDPOINT }
    });
    
    if (error) {
      console.error(`Proxy error: ${error.message}`);
      throw new Error(`Proxy error: ${error.message}`);
    }
    
    console.log('TAO subnets API response:', data);
    
    // Process and map the data
    return data.map((subnet: any) => {
      // Get the real subnet name if available, otherwise use the mapping
      let subnetName = subnet.name;
      const netuid = typeof subnet.netuid === 'number' ? subnet.netuid : parseInt(subnet.netuid, 10);
      
      // If the API doesn't provide a meaningful name or it's generic, use our mapping
      if (!subnetName || 
          (typeof subnetName === 'string' && subnetName.toLowerCase().includes('subnet')) || 
          (typeof subnetName === 'string' && subnetName.toLowerCase() === 'unknown')) {
        subnetName = SUBNET_NAME_MAPPING[netuid] || `Subnet ${netuid}`;
      }
      
      // Format emission properly
      let emission = subnet.emission;
      
      // Add τ/day suffix only if it's a string that doesn't already include it
      if (typeof emission === 'string' && !emission.includes('τ')) {
        emission = `${emission}τ/day`;
      } else if (typeof emission === 'number') {
        emission = `${emission.toFixed(4)}τ/day`;
      }
      
      // Extract API information if available
      const apiEndpoint = subnet.api_endpoint || null;
      const apiDocsUrl = subnet.api_docs_url || null;
      const apiVersion = subnet.api_version || null;
      const lastApiCheck = subnet.last_api_check || new Date().toISOString();
      const apiStatus = subnet.api_status || 'unknown';
      
      // Make sure all required fields have valid values
      return {
        netuid,
        name: subnetName,
        neurons: subnet.neurons || 0,
        emission: emission,
        description: subnet.description || `${subnetName} subnet for the TAO network`,
        tempo: subnet.tempo || 0,
        incentive: subnet.incentive || 0,
        // Add price-related fields that might be available in the API
        price: typeof subnet.price === 'number' ? subnet.price : parseFloat(subnet.price) || 0,
        market_cap: subnet.market_cap || 0,
        volume_24h: subnet.volume_24h || 0,
        price_change_1h: subnet.price_change_1h || 0,
        price_change_24h: subnet.price_change_24h || 0,
        price_change_7d: subnet.price_change_7d || 0,
        // API information fields
        api_endpoint: apiEndpoint,
        api_docs_url: apiDocsUrl,
        api_version: apiVersion,
        last_api_check: lastApiCheck,
        api_status: apiStatus
      };
    });
  } catch (error) {
    console.error('Error fetching TAO subnets:', error);
    
    // If the API fails, use our mock data but with real subnet names
    console.log('Using mock subnet data with real names');
    return MOCK_TAO_STATS.subnets.map(subnet => {
      const netuid = typeof subnet.netuid === 'number' ? subnet.netuid : parseInt(subnet.netuid, 10);
      const subnetName = SUBNET_NAME_MAPPING[netuid] || `Subnet ${netuid}`;
      
      // Format emission properly for mock data too
      let emission = subnet.emission;
      
      if (typeof emission === 'string' && !emission.includes('τ')) {
        emission = `${emission}τ/day`;
      } else if (typeof emission === 'number') {
        emission = `${emission.toFixed(4)}τ/day`;
      }
      
      return {
        ...subnet,
        name: subnetName,
        emission: emission
      };
    });
  }
};
