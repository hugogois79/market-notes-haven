
/**
 * Enhances vacation note content for printing
 * - Increases font sizes
 * - Adds color to headlines
 * - Centers text content
 * - Identifies and formats dates and itineraries
 * - Adds proper formatting for images
 */
export const enhanceVacationContent = (content: string): string => {
  if (!content) return '';
  
  // Enhanced headline colors and sizes for vacation notes with improved spacing
  let enhancedContent = content.replace(/<h1([^>]*)>/gi, '<h1$1 style="text-align: center; font-size: 24pt; color: #9b87f5; font-weight: bold; margin: 2em 0 1em;">');
  enhancedContent = enhancedContent.replace(/<h2([^>]*)>/gi, '<h2$1 style="text-align: center; font-size: 20pt; color: #7E69AB; font-weight: bold; margin: 1.5em 0 0.8em;">');
  enhancedContent = enhancedContent.replace(/<h3([^>]*)>/gi, '<h3$1 style="text-align: center; font-size: 18pt; color: #6E59A5; font-weight: bold; margin: 1.2em 0 0.6em;">');
  
  // Center and style paragraphs with improved spacing
  enhancedContent = enhancedContent.replace(/<p([^>]*)>/gi, '<p$1 style="text-align: center; font-size: 14pt; color: #333; margin: 1em 0;">');
  
  // Format dates - identify date patterns like "Day 1", "Day 2" etc. with special styling and enhanced spacing
  enhancedContent = enhancedContent.replace(
    /(<h[1-3][^>]*>)(Day\s+\d+)([^<]*<\/h[1-3]>)/gi,
    '<div class="vacation-day-header" style="margin: 2.5em 0 1.5em;"><div style="display: inline-block; padding: 0.5em 1.5em; background-color: #F3F0FF; border-radius: 8px;">$1<span class="vacation-day-number" style="color: #8B5CF6; font-size: 1.2em;">$2</span>$3</div></div>'
  );
  
  // Enhance image display if present with more spacing
  enhancedContent = enhancedContent.replace(
    /<img([^>]*)>/gi,
    '<div class="vacation-image-container" style="text-align: center; margin: 2em 0;"><img$1 class="vacation-image" style="max-width: 80%; height: auto; border: 3px solid #D6BCFA; border-radius: 10px;"></div>'
  );
  
  // Add classes to lists to improve itinerary formatting with better spacing
  enhancedContent = enhancedContent.replace(
    /<ul([^>]*)>/gi,
    '<ul$1 class="vacation-itinerary" style="text-align: center; list-style-position: inside; color: #6E59A5; margin: 1.5em 0; padding: 0;">'
  );
  
  // Format list items for activities with vibrant colors and improved spacing
  enhancedContent = enhancedContent.replace(
    /<li([^>]*)>/gi,
    '<li$1 style="font-size: 14pt; color: #7E69AB; margin: 0.8em 0; line-height: 1.6;">'
  );
  
  return enhancedContent;
};

