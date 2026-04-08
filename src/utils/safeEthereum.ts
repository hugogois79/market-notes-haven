
/**
 * Safely checks if ethereum is available without attempting to redefine it
 */
export const isEthereumAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           'ethereum' in window && 
           window.ethereum !== undefined;
  } catch (error) {
    console.error('Error checking ethereum availability:', error);
    return false;
  }
};

/**
 * Safely gets the ethereum provider without triggering property redefinition
 */
export const getSafeEthereumProvider = () => {
  if (isEthereumAvailable()) {
    return window.ethereum;
  }
  return null;
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = async (): Promise<boolean> => {
  try {
    const provider = getSafeEthereumProvider();
    if (!provider) return false;
    
    const accounts = await provider.request({ method: 'eth_accounts' });
    return Array.isArray(accounts) && accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

/**
 * Request wallet connection
 */
export const requestWalletConnection = async (): Promise<string[]> => {
  try {
    const provider = getSafeEthereumProvider();
    if (!provider) {
      throw new Error('Ethereum provider not available');
    }
    
    return await provider.request({ method: 'eth_requestAccounts' });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};
