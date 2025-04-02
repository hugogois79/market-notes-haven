
/**
 * Helper function to normalize styles before printing
 */
export const normalizeContent = (content: string): string => {
  if (!content) return '';
  
  // Process content to ensure proper font weights and sizes
  return content
    // Add normal font-weight to paragraphs without explicit font-weight
    .replace(/<p([^>]*?)>/gi, function(match, p1) {
      // Only add font-weight: normal if font-weight isn't already specified
      if (!/font-weight/i.test(p1)) {
        return `<p${p1} style="font-weight: normal; font-size: 9pt;">`;
      }
      return match;
    })
    // Remove any blanket font-weight: bold styles that might be causing all text to be bold
    .replace(/font-weight:\s*bold/gi, 'font-weight: normal')
    // But keep bold tags and strong tags bold
    .replace(/<b([^>]*)>/gi, '<b$1 style="font-weight: bold !important;">')
    .replace(/<strong([^>]*)>/gi, '<strong$1 style="font-weight: bold !important;">')
    // Make sure all headings have appropriate sizes and styles
    .replace(/<h1([^>]*?)>/gi, '<h1$1 style="font-size: 12pt; font-weight: bold; text-decoration: underline;">')
    .replace(/<h2([^>]*?)>/gi, '<h2$1 style="font-size: 11pt; font-weight: bold;">')
    .replace(/<h3([^>]*?)>/gi, '<h3$1 style="font-size: 10pt; font-weight: bold;">')
    // Make list items smaller
    .replace(/<li([^>]*?)>/gi, '<li$1 style="font-size: 9pt; font-weight: normal;">')
    // Make table cells smaller
    .replace(/<td([^>]*?)>/gi, '<td$1 style="font-size: 8pt; font-weight: normal; padding: 4px;">')
    .replace(/<th([^>]*?)>/gi, '<th$1 style="font-size: 8pt; font-weight: bold; padding: 4px; background-color: #f3f4f6;">');
};
