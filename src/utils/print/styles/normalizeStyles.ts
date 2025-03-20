/**
 * Helper function to normalize styles before printing
 */
export const normalizeContent = (content: string): string => {
  if (!content) return '';
  
  // Process content to ensure proper font weights
  return content
    // Add normal font-weight to paragraphs without explicit font-weight
    .replace(/<p([^>]*?)>/gi, function(match, p1) {
      // Only add font-weight: normal if font-weight isn't already specified
      if (!/font-weight/i.test(p1)) {
        return `<p${p1} style="font-weight: normal;">`;
      }
      return match;
    })
    // Remove any blanket font-weight: bold styles that might be causing all text to be bold
    .replace(/font-weight:\s*bold/gi, 'font-weight: normal')
    // But keep bold tags and strong tags bold
    .replace(/<b([^>]*)>/gi, '<b$1 style="font-weight: bold !important;">')
    .replace(/<strong([^>]*)>/gi, '<strong$1 style="font-weight: bold !important;">');
};
