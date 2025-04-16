
import { TaoStatsUpdate } from "@/services/taoStatsService";
import { format } from "date-fns";

/**
 * Generate Tana-compatible markdown from TAO stats
 */
export const generateTaoStatsTanaMarkdown = (stats: TaoStatsUpdate): string => {
  try {
    // Format timestamp
    const timestamp = format(new Date(stats.timestamp), "PPpp");
    
    // Generate header and metadata
    let markdown = `- TAO Stats Update (${timestamp}) #[[TAO Update]]\n`;
    markdown += `  - Price (USD):: $${stats.price.toFixed(2)}\n`;
    markdown += `  - Market Cap (USD):: $${stats.market_cap.toLocaleString()}\n`;
    
    // Add volume and price change if available
    if (stats.volume_24h) {
      markdown += `  - Volume 24h:: $${stats.volume_24h.toLocaleString()}\n`;
    }
    
    if (stats.price_change_percentage_24h) {
      const priceChange = stats.price_change_percentage_24h;
      const sign = priceChange >= 0 ? '+' : '';
      markdown += `  - Price Change 24h:: ${sign}${priceChange.toFixed(2)}%\n`;
    }
    
    // Add subnet information
    markdown += `  - Subnets:: ${stats.subnets.length}\n`;
    markdown += `  - Subnets:\n`;
    
    // Add each subnet
    stats.subnets.forEach(subnet => {
      markdown += `    - ${subnet.name}\n`;
      markdown += `      - ID:: ${subnet.netuid}\n`;
      markdown += `      - Neuron Count:: ${subnet.neurons}\n`;
      markdown += `      - Emission Rate:: ${subnet.emission.toFixed(4)} τ/day\n`;
    });
    
    return markdown;
  } catch (error) {
    console.error('Error generating Tana markdown:', error);
    return '- Error generating TAO stats markdown';
  }
};

/**
 * Copy the generated markdown to clipboard
 */
export const copyTaoStatsToClipboard = async (stats: TaoStatsUpdate): Promise<boolean> => {
  try {
    const markdown = generateTaoStatsTanaMarkdown(stats);
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Download the generated markdown as a file
 */
export const downloadTaoStatsAsMarkdown = (stats: TaoStatsUpdate): void => {
  try {
    const markdown = generateTaoStatsTanaMarkdown(stats);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `tao-stats-${date}.md`;
    
    // Create a blob and download link
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Set up and trigger download
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Failed to download markdown:', error);
  }
};
