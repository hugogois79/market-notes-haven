
import { COINGECKO_API_URL, BITTENSOR_ID } from './apiConfig';

/**
 * Client for CoinGecko API to fetch TAO price data
 */
export const fetchTaoPriceFromCoinGecko = async (): Promise<{
  price: number;
  market_cap: number;
  price_change_percentage_24h?: number;
  volume_24h?: number;
}> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${BITTENSOR_ID}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      price: data.market_data.current_price.usd || 0,
      market_cap: data.market_data.market_cap.usd || 0,
      price_change_percentage_24h: data.market_data.price_change_percentage_24h,
      volume_24h: data.market_data.total_volume.usd
    };
  } catch (error) {
    console.error('Error fetching TAO price from CoinGecko:', error);
    throw error;
  }
};
