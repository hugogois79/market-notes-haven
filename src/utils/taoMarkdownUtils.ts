
import { TaoStatsUpdate } from '@/services/taoStatsService';

/**
 * Generates a markdown representation of TAO stats for Tana
 */
export const generateTaoStatsTanaMarkdown = (stats: TaoStatsUpdate): string => {
  // Format timestamp
  const timestamp = new Date(stats.timestamp).toLocaleString();
  
  // Start building the markdown
  let markdown = `- TAO Stats Update (${timestamp}) #[[TAO Update]]\n`;
  markdown += `  - Price (USD):: $${stats.price.toFixed(2)}\n`;
  markdown += `  - Market Cap (USD):: $${stats.market_cap.toLocaleString()}\n`;
  markdown += `  - Subnets:\n`;
  
  // Add subnet data
  stats.subnets.forEach(subnet => {
    markdown += `    - ${subnet.name}\n`;
    markdown += `      - ID:: ${subnet.netuid}\n`;
    markdown += `      - Neuron Count:: ${subnet.neurons}\n`;
    markdown += `      - Emission Rate:: ${subnet.emission.toFixed(4)} TAO/day\n`;
  });
  
  return markdown;
};

/**
 * Copies TAO stats markdown to clipboard
 */
export const copyTaoStatsToClipboard = async (stats: TaoStatsUpdate): Promise<boolean> => {
  try {
    const markdown = generateTaoStatsTanaMarkdown(stats);
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (error) {
    console.error('Failed to copy TAO stats to clipboard:', error);
    return false;
  }
};

/**
 * Downloads TAO stats as a markdown file
 */
export const downloadTaoStatsAsMarkdown = (stats: TaoStatsUpdate): void => {
  const markdown = generateTaoStatsTanaMarkdown(stats);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `tao-stats-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
