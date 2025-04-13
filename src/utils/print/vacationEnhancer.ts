
/**
 * Enhances vacation note content for printing
 * - Centers text content
 * - Identifies and formats dates and itineraries
 * - Adds proper formatting for images
 */
export const enhanceVacationContent = (content: string): string => {
  if (!content) return '';
  
  // Center all paragraphs in vacation notes and make text larger
  let enhancedContent = content.replace(/<p([^>]*)>/gi, '<p$1 style="text-align: center; font-size: 10pt;">');
  
  // Center all headings and make them larger
  enhancedContent = enhancedContent.replace(/<h1([^>]*)>/gi, '<h1$1 style="text-align: center; font-size: 16pt; color: #1967d2;">');
  enhancedContent = enhancedContent.replace(/<h2([^>]*)>/gi, '<h2$1 style="text-align: center; font-size: 14pt; color: #1967d2;">');
  enhancedContent = enhancedContent.replace(/<h3([^>]*)>/gi, '<h3$1 style="text-align: center; font-size: 12pt; color: #1967d2;">');
  
  // Format dates - identify date patterns like "Day 1", "Day 2" etc.
  enhancedContent = enhancedContent.replace(
    /(<h[1-3][^>]*>)(Day\s+\d+)([^<]*<\/h[1-3]>)/gi,
    '<div class="vacation-day-header">$1<span class="vacation-day-number">$2</span>$3</div>'
  );
  
  // Format dates - detect other date formats like "January 15" or "15th Jan" 
  const datePatterns = [
    // Month Day pattern (January 15)
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?/gi,
    // Day Month pattern (15 January)
    /\d{1,2}(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
    // MM/DD or DD/MM patterns
    /\d{1,2}\/\d{1,2}(\/\d{2,4})?/g
  ];
  
  // Apply date highlighting to headings containing dates
  datePatterns.forEach(pattern => {
    enhancedContent = enhancedContent.replace(
      new RegExp(`(<h[1-3][^>]*>)([^<]*?)(${pattern.source})([^<]*?)(<\\/h[1-3]>)`, 'gi'),
      '$1$2<span class="vacation-date">$3</span>$4$5'
    );
  });
  
  // Enhance image display if present
  enhancedContent = enhancedContent.replace(
    /<img([^>]*)>/gi,
    '<div class="vacation-image-container"><img$1 class="vacation-image"></div>'
  );
  
  // Add classes to lists to improve itinerary formatting
  enhancedContent = enhancedContent.replace(
    /<ul([^>]*)>/gi,
    '<ul$1 class="vacation-itinerary">'
  );
  
  // Format list items for activities
  enhancedContent = enhancedContent.replace(
    /<li([^>]*)>/gi,
    '<li$1 class="vacation-activity">'
  );
  
  return enhancedContent;
};
