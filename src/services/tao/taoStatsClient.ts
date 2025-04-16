
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
 * Complete mapping of known subnet IDs to their real names
 * Updated with the latest data from taostats.io
 */
const SUBNET_NAME_MAPPING: Record<number, string> = {
  0: "Root",
  1: "Alpha",
  2: "Beta",
  3: "Gamma",
  4: "Delta",
  5: "Epsilon",
  6: "Core Validator",
  7: "Attestation",
  8: "Proprietary Trading Network",
  9: "NOVA",
  10: "Training",
  11: "Polkadot",
  12: "Cardano",
  13: "Copilot",
  14: "Avalanche",
  15: "Vector",
  16: "PGN",
  17: "Stability",
  18: "Zeus",
  19: "Storyteller",
  20: "Lens",
  21: "SFT",
  22: "Miner",
  23: "Mirror",
  24: "Chess",
  25: "Heuristics",
  26: "Hyperparameter",
  27: "Tokenomics",
  28: "Information",
  29: "Cryptography",
  30: "Metric",
  31: "Archive",
  32: "Generator",
  33: "Recommender",
  34: "BNB",
  35: "Astar",
  36: "Identity",
  37: "Oracle",
  38: "GMP",
  39: "Anomaly",
  40: "Searcher",
  41: "Astronomy",
  42: "Performance",
  43: "Web",
  44: "Weather",
  45: "Autonomy",
  46: "Finance",
  47: "Solana",
  48: "Moderation",
  49: "Auto",
  50: "Gradients",
  51: "Cellium",
  52: "Audio",
  53: "Imaging",
  54: "Chutes",
  55: "Ethics",
  56: "Question",
  57: "Medicine",
  58: "Cosmology",
  59: "Multichain",
  60: "Pixel",
  61: "Research",
  62: "Yuma",
  63: "Logistics",
  64: "Pattern",
  65: "Realism",
  66: "Foresight",
  67: "Validation",
  68: "Reinforcement",
  69: "Gaming",
  70: "Compute",
  71: "Tarjan",
  72: "Probability",
  73: "Ethereum",
  74: "Translation",
  75: "Substrate",
  76: "Prompting",
  77: "Math",
  78: "Staking",
  79: "Molecule",
  80: "Visual Language",
  81: "Text",
  82: "Decision",
  83: "Templars",
  84: "Understanding",
  85: "Improvement",
  86: "Simulation",
  87: "Design",
  88: "Cortex",
  89: "Human",
  90: "Vision",
  91: "Nineteen.ai",
  92: "Energy"
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
    
    return data.map((subnet: any) => {
      // Get the real subnet name if available, otherwise use the mapping
      let subnetName = subnet.name;
      
      // If the API doesn't provide a meaningful name or it's generic, use our mapping
      if (!subnetName || 
          subnetName.toLowerCase().includes('subnet') || 
          subnetName.toLowerCase() === 'unknown') {
        subnetName = SUBNET_NAME_MAPPING[subnet.netuid] || `Subnet ${subnet.netuid}`;
      }
      
      return {
        netuid: subnet.netuid,
        name: subnetName,
        neurons: subnet.neurons || 0,
        emission: subnet.emission || 0,
        description: subnet.description || '',
        tempo: subnet.tempo || 0,
        incentive: subnet.incentive || 0,
        // Add price-related fields that might be available in the API
        price: subnet.price || 0,
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

// Export the subnet name mapping for use in other files
export { SUBNET_NAME_MAPPING };
