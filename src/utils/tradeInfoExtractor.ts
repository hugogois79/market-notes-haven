
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
  
  // Extract target price
  result.targetPrice = findTargetPrice(plainText);
  
  // Extract stop price
  result.stopPrice = findStopPrice(plainText);
  
  // Handle HTML table content specifically
  if (content.includes("<table") && content.includes("<tr")) {
    // If the content has tables, try to extract structured trade data
    extractTradeInfoFromTable(content, result, availableTokens);
  }
  
  return result;
};

/**
 * Extract trading info from HTML tables in the content
 */
const extractTradeInfoFromTable = (content: string, result: TradeInfo, availableTokens: Token[]) => {
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Look for tables with trade information
  const tables = tempDiv.querySelectorAll('table');
  if (tables.length === 0) return;
  
  // Try to identify a table with trade data
  for (const table of tables) {
    const rows = table.querySelectorAll('tr');
    if (rows.length <= 1) continue; // Skip tables with only header row
    
    // Check if this looks like a trade table
    const headers = rows[0].querySelectorAll('th');
    const headerText = Array.from(headers).map(h => h.textContent?.toLowerCase().trim());
    
    // If we find a table with price/qty columns, try to extract data
    if (headerText.some(h => h && 
        (h.includes('price') || h.includes('qty') || h.includes('entry') || 
         h.includes('target') || h.includes('stop') || h.includes('btc')))) {
      
      // Extract data from the first data row (assuming it's the most relevant trade)
      const dataCells = rows[1].querySelectorAll('td');
      const cellTexts = Array.from(dataCells).map(cell => cell.textContent?.trim() || '');
      
      // Try to map columns to trade info
      for (let i = 0; i < headerText.length; i++) {
        const header = headerText[i];
        const value = cellTexts[i];
        if (!header || !value) continue;
        
        // Initial quantity
        if (header.includes('initial') && header.includes('qty')) {
          const qty = parseFloat(value.replace(/[^\d.]/g, ''));
          if (!isNaN(qty) && (result.quantity === undefined || qty > 0)) {
            result.quantity = qty;
          }
        }
        
        // Entry price/zone 
        if (header.includes('entry') || 
            (header.includes('zone') && !header.includes('target'))) {
          // Parse entry price from range format like $79,800-$80,200
          const priceMatch = value.match(/[\d,.]+/g);
          if (priceMatch && priceMatch.length > 0) {
            const price = parseFloat(priceMatch[0].replace(/[^\d.]/g, ''));
            if (!isNaN(price) && price > 0) {
              result.entryPrice = price;
            }
          }
        }
        
        // Stop loss
        if (header.includes('stop') || header.includes('loss')) {
          const priceMatch = value.match(/[\d,.]+/g);
          if (priceMatch && priceMatch.length > 0) {
            const price = parseFloat(priceMatch[0].replace(/[^\d.]/g, ''));
            if (!isNaN(price) && price > 0) {
              result.stopPrice = price;
            }
          }
        }
        
        // Target price
        if (header.includes('target')) {
          const priceMatch = value.match(/[\d,.]+/g);
          if (priceMatch && priceMatch.length > 0) {
            const price = parseFloat(priceMatch[0].replace(/[^\d.]/g, ''));
            if (!isNaN(price) && price > 0) {
              result.targetPrice = price;
            }
          }
        }
        
        // Token detection from cell
        if (value.includes('BTC') || value.includes('ETH') || 
            value.includes('USDT') || value.includes('USD')) {
          // Try to identify token
          for (const token of availableTokens) {
            if (value.includes(token.symbol)) {
              result.tokenId = token.id;
              break;
            }
          }
        }
      }
    }
  }
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
    /(\d[\d,]*\.?\d*)\s*contracts/i,
    /qty[:\s]+(\d[\d,]*\.?\d*)/i,
    /add\s+qty[:\s]+(\d[\d,]*\.?\d*)/i,
    /initial\s+qty[:\s]+(\d[\d,]*\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*BTC/i,
    /(\d[\d,]*\.?\d*)\s*ETH/i
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
    /entry zone[:\s]+\$?\s*([\d,]+\.?\d*)/i,
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

/**
 * Extract target price from text
 */
const findTargetPrice = (text: string): number | undefined => {
  // Look for target price patterns
  const patterns = [
    /target price[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /target[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /price target[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /tp[:\s]+\$?\s*([\d,]+\.?\d*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return undefined;
};

/**
 * Extract stop price from text
 */
const findStopPrice = (text: string): number | undefined => {
  // Look for stop price patterns
  const patterns = [
    /stop price[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /stop loss[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /stop[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /sl[:\s]+\$?\s*([\d,]+\.?\d*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return undefined;
};
