
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
  try {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Look for tables with trade information
    const tables = tempDiv.querySelectorAll('table');
    if (tables.length === 0) return;
    
    console.log(`Found ${tables.length} tables in content`);
    
    // Try to identify a table with trade data
    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      if (rows.length <= 1) continue; // Skip tables with only header row
      
      console.log(`Table has ${rows.length} rows`);
      
      // Check if this looks like a trade table
      const headers = rows[0].querySelectorAll('th');
      const headerText = Array.from(headers).map(h => h.textContent?.toLowerCase().trim() || "");
      
      console.log("Table headers:", headerText);
      
      // If we find a table with price/qty columns, try to extract data
      if (headerText.some(h => h && 
          (h.includes('price') || h.includes('qty') || h.includes('entry') || 
           h.includes('target') || h.includes('stop') || h.includes('token') || 
           h.includes('pair') || h.includes('coin')))) {
        
        // We'll process all data rows (not just the first one)
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
          const dataCells = rows[rowIndex].querySelectorAll('td');
          
          // Skip rows without enough cells
          if (dataCells.length < 2) continue;
          
          const cellTexts = Array.from(dataCells).map(cell => cell.textContent?.trim() || '');
          console.log(`Row ${rowIndex} data:`, cellTexts);
          
          // Extract token information from this row
          let rowTokenId: string | undefined = undefined;
          let rowQuantity: number | undefined = undefined;
          let rowEntryPrice: number | undefined = undefined;
          let rowTargetPrice: number | undefined = undefined;
          let rowStopPrice: number | undefined = undefined;
          
          // Try to map columns to trade info based on headers
          for (let i = 0; i < headerText.length && i < cellTexts.length; i++) {
            const header = headerText[i]?.toLowerCase() || "";
            const value = cellTexts[i];
            if (!value) continue;
            
            // Token/Pair/Coin column
            if (header.includes('token') || header.includes('pair') || header.includes('coin') || 
                header.includes('asset') || header.includes('symbol')) {
              // Try to extract token ID
              for (const token of availableTokens) {
                if (value.includes(token.symbol) || value.toLowerCase().includes(token.name.toLowerCase())) {
                  rowTokenId = token.id;
                  break;
                }
              }
            }
            
            // Quantity
            if (header.includes('qty') || header.includes('amount') || header.includes('size') || 
                header.includes('quantity') || header.includes('volume')) {
              const qtyMatch = value.match(/[\d,.]+/);
              if (qtyMatch) {
                rowQuantity = parseFloat(qtyMatch[0].replace(/,/g, ''));
              }
            }
            
            // Entry price
            if (header.includes('entry') || header.includes('buy') || 
                (header.includes('price') && !header.includes('target') && !header.includes('stop'))) {
              const priceMatch = value.match(/[\d,.]+/);
              if (priceMatch) {
                rowEntryPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
              }
            }
            
            // Target price
            if (header.includes('target') || header.includes('tp') || header.includes('take profit')) {
              const priceMatch = value.match(/[\d,.]+/);
              if (priceMatch) {
                rowTargetPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
              }
            }
            
            // Stop price
            if (header.includes('stop') || header.includes('sl') || header.includes('stop loss')) {
              const priceMatch = value.match(/[\d,.]+/);
              if (priceMatch) {
                rowStopPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
              }
            }
          }
          
          // If we found meaningful data in this row and result is still empty, use this data
          if (rowTokenId && (rowQuantity || rowEntryPrice) && !result.tokenId) {
            result.tokenId = rowTokenId;
            if (rowQuantity) result.quantity = rowQuantity;
            if (rowEntryPrice) result.entryPrice = rowEntryPrice;
            if (rowTargetPrice) result.targetPrice = rowTargetPrice;
            if (rowStopPrice) result.stopPrice = rowStopPrice;
            
            console.log("Extracted trade info from table row:", {
              tokenId: rowTokenId,
              quantity: rowQuantity,
              entryPrice: rowEntryPrice,
              targetPrice: rowTargetPrice,
              stopPrice: rowStopPrice
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error parsing HTML tables:", error);
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
    /at\s+\$\s*([\d,]+\.?\d*)/i,
    /(\d[\d,]*\.?\d*)\s*(?:USD|USDT|USDC)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  // More general pattern, use as last resort
  const dollarPattern = /\$\s*([\d,]+\.?\d*)/i;
  const dollarMatch = text.match(dollarPattern);
  if (dollarMatch && dollarMatch[1]) {
    return parseFloat(dollarMatch[1].replace(/,/g, ''));
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
    /tp[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /take profit[:\s]+\$?\s*([\d,]+\.?\d*)/i
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
