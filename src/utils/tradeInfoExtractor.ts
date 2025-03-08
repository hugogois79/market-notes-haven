
import { TradeInfo } from "@/types";
import { Token } from "@/types";

/**
 * Analyzes note content to extract trading information
 * 
 * @param content The HTML content of the note
 * @param availableTokens List of available tokens to match against
 * @returns TradeInfo object with extracted data
 */
export const extractTradeInfo = (content: string, availableTokens: Token[]): TradeInfo => {
  // Remove HTML tags to get clean text for analysis
  const plainText = content.replace(/<[^>]*>/g, ' ').trim();
  
  // Initialize result
  const result: TradeInfo = {};
  
  // Extract token information
  result.tokenId = findTokenId(plainText, availableTokens);
  
  // Extract quantity
  result.quantity = findQuantity(plainText);
  
  // Extract entry price
  result.entryPrice = findEntryPrice(plainText);
  
  return result;
};

/**
 * Find token ID by matching token name/symbol in the text
 */
const findTokenId = (text: string, availableTokens: Token[]): string | undefined => {
  if (!availableTokens || availableTokens.length === 0) return undefined;
  
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // First try exact match with symbols (which are typically shorter and more specific)
  for (const token of availableTokens) {
    // Check for exact symbol matches (with word boundaries)
    const symbolRegex = new RegExp(`\\b${token.symbol.toLowerCase()}\\b`, 'i');
    if (symbolRegex.test(lowerText)) {
      return token.id;
    }
  }
  
  // Then try name matching (which might be more prone to false positives)
  for (const token of availableTokens) {
    // Check for token name mentions (with word boundaries)
    const nameRegex = new RegExp(`\\b${token.name.toLowerCase()}\\b`, 'i');
    if (nameRegex.test(lowerText)) {
      return token.id;
    }
  }
  
  return undefined;
};

/**
 * Extract quantity information from text
 */
const findQuantity = (text: string): number | undefined => {
  // Look for quantity patterns like "X tokens", "X coins", "quantity: X", "X CRV" etc.
  const patterns = [
    /quantity:\s*([\d,]+\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*tokens/i,
    /(\d[\d,]*\.?\d*)\s*coins/i,
    /position size[:\s]+(\d[\d,]*\.?\d*)/i,
    /buying\s+(\d[\d,]*\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*contracts/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Remove commas and convert to number
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return undefined;
};

/**
 * Extract entry price from text
 */
const findEntryPrice = (text: string): number | undefined => {
  // Look for entry price patterns
  const patterns = [
    /entry price[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /price[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /entry[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)/i, // This is a more general pattern, use as last resort
    /at\s+\$\s*([\d,]+\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*(?:USD|USDT|USDC)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return undefined;
};
