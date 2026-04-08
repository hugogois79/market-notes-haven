
import { Note } from "@/types";
import { formatDate } from "./formatUtils";
import { getPrintStyles } from "./printStyles";

/**
 * Generates HTML for the print window
 */
export const generatePrintHtml = (note: Note): string => {
  // Ensure the title is not empty
  const noteTitle = note.title ? note.title.trim() : "Untitled Note";
  
  // Format created/updated dates
  const createdDate = formatDate(note.createdAt);
  const updatedDate = formatDate(note.updatedAt);
  
  // Format tags
  const tagsHtml = note.tags && note.tags.length > 0 
    ? `
      <div class="print-tags">
        ${note.tags.map(tag => `<span class="print-tag">${tag}</span>`).join(' ')}
      </div>
    ` 
    : '';

  // Process content to preserve HTML
  let processedContent = note.content || '';
  
  // Check if this is a vacation note
  const isVacationNote = note.category === 'Vacations' || note.category === 'Vacation';
  const vacationBodyClass = isVacationNote ? 'vacation-print' : '';

  // Extract conclusion if it exists
  let conclusionHtml = '';
  let contentWithoutConclusion = processedContent;
  
  if (processedContent) {
    // Look for <h1>, <h2>, or <h3> heading with "Conclusion"
    const conclusionRegex = /<h[1-3][^>]*>\s*Conclusion\s*<\/h[1-3]>([\s\S]*?)(<h[1-3]|$)/i;
    const match = processedContent.match(conclusionRegex);
    
    if (match && match[1]) {
      // Get content until the next heading or end of content
      let conclusionContent = match[1];
      // Remove the ending heading tag if it was captured
      if (match[2] && match[2].startsWith('<h')) {
        conclusionContent = conclusionContent.slice(0, -match[2].length);
      }
      
      // Create the conclusion section HTML
      conclusionHtml = `
        <div class="print-conclusion">
          <h3 class="print-conclusion-header">Conclusion</h3>
          <div class="print-conclusion-content">
            ${conclusionContent.trim()}
          </div>
        </div>
      `;
      
      // Remove the conclusion from the main content to avoid duplication
      // This will remove the heading and the conclusion content
      const fullMatch = match[0].slice(0, match[0].length - (match[2].startsWith('<h') ? match[2].length : 0));
      contentWithoutConclusion = processedContent.replace(fullMatch, '');
    }
  }
  
  // Enhanced content processing for text alignment and font sizes
  const enhancedContent = contentWithoutConclusion
    // Strengthen justified text styling
    .replace(/text-align:\s*justify/gi, 'text-align: justify !important')
    // Add more specific class for elements with justify alignment
    .replace(/<([^>]+?)style="([^"]*?)text-align:\s*justify([^"]*?)"([^>]*?)>/gi, 
             '<$1style="$2text-align: justify !important$3" class="text-justify"$4>')
    // Handle paragraphs that should be justified but don't have explicit style
    .replace(/<p\s+class="text-justify"([^>]*)>/gi, 
             '<p class="text-justify" style="text-align: justify !important"$1>')
    // Remove any unwanted font-weight styles that might be causing all text to be bold
    .replace(/font-weight:\s*bold|font-weight:\s*[5-9]00/gi, '')
    // Add font-weight: normal to all p tags that don't have explicit font-weight
    .replace(/<p([^>]*?)>/gi, function(match, p1) {
      // Only add font-weight: normal if font-weight isn't already specified
      if (!/font-weight/i.test(p1)) {
        return `<p${p1} style="font-weight: normal; font-size: ${isVacationNote ? '10pt' : '8pt'}; margin-bottom: 0.05rem;">`;
      }
      return match;
    })
    // Make sure all font sizes are appropriate for printing
    .replace(/<h1([^>]*?)>/gi, `<h1$1 style="font-size: ${isVacationNote ? '14pt' : '10pt'}; font-weight: bold; margin-bottom: 0.1rem; margin-top: 0.3rem;">`)
    .replace(/<h2([^>]*?)>/gi, `<h2$1 style="font-size: ${isVacationNote ? '12pt' : '9pt'}; font-weight: bold; margin-bottom: 0.1rem; margin-top: 0.2rem;">`)
    .replace(/<h3([^>]*?)>/gi, `<h3$1 style="font-size: ${isVacationNote ? '11pt' : '8.5pt'}; font-weight: bold; margin-bottom: 0.05rem; margin-top: 0.15rem;">`)
    // Make list items smaller with less spacing
    .replace(/<li([^>]*?)>/gi, `<li$1 style="font-size: ${isVacationNote ? '10pt' : '8pt'}; font-weight: normal; margin-bottom: 0.05rem;">`)
    // Make table cells smaller
    .replace(/<td([^>]*?)>/gi, `<td$1 style="font-size: ${isVacationNote ? '9pt' : '7.5pt'}; font-weight: normal; padding: 2px;">`)
    .replace(/<th([^>]*?)>/gi, `<th$1 style="font-size: ${isVacationNote ? '9pt' : '7.5pt'}; font-weight: bold; padding: 2px; background-color: #f3f4f6;">`);
  
  // Generate AI summary section if available
  let summaryHtml = '';
  if (note.summary) {
    // Check if summary is a string or potentially JSON stored as string
    let summaryContent = note.summary;
    try {
      // Try to parse as JSON in case it's stored that way
      const parsedSummary = JSON.parse(note.summary);
      if (parsedSummary && typeof parsedSummary === 'object' && parsedSummary.summary) {
        summaryContent = parsedSummary.summary;
      }
    } catch (e) {
      // Not JSON, use as-is
      summaryContent = note.summary;
    }
    
    summaryHtml = `
      <div class="print-summary">
        <div class="print-summary-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="print-summary-icon">
            <path d="M12 3L20 12L12 21L4 12L12 3Z"></path>
          </svg>
          AI Summary
        </div>
        <div class="print-summary-content" style="font-size: ${isVacationNote ? '10pt' : '8pt'}; font-weight: normal;">
          ${summaryContent.split('**').map((part, index) => {
            // If the index is odd, it's a bold part
            return index % 2 === 1 
              ? `<strong class="print-summary-highlight">${part}</strong>` 
              : part;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  // Get print styles
  const printStyles = getPrintStyles();
  
  // Create the complete HTML document for printing with wrapper class for justified content
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${noteTitle}</title>
      ${printStyles}
      <style>
        /* Additional overrides for print */
        @media print {
          body { font-size: ${isVacationNote ? '10pt' : '8pt'} !important; }
          p, div, span, li { font-size: ${isVacationNote ? '10pt' : '8pt'} !important; margin-top: 0 !important; margin-bottom: 0.05rem !important; }
          .print-content p, .print-content div, .print-content span, .print-content li { 
            font-size: ${isVacationNote ? '10pt' : '8pt'} !important; 
            margin-top: 0 !important;
            margin-bottom: 0.05rem !important;
          }
          .print-content ul, .print-content ol {
            padding-left: 10px;
            margin: 2px 0;
          }
          .print-content li {
            margin-bottom: 1px;
          }
          .print-content h1 { font-size: ${isVacationNote ? '14pt' : '10pt'} !important; margin-top: 0.3rem !important; margin-bottom: 0.1rem !important; }
          .print-content h2 { font-size: ${isVacationNote ? '12pt' : '9pt'} !important; margin-top: 0.2rem !important; margin-bottom: 0.1rem !important; }
          .print-content h3 { font-size: ${isVacationNote ? '11pt' : '8.5pt'} !important; margin-top: 0.15rem !important; margin-bottom: 0.05rem !important; }
          .print-title { font-size: ${isVacationNote ? '24pt' : '12pt'} !important; }
          .print-summary-content, .print-conclusion-content { font-size: ${isVacationNote ? '10pt' : '8pt'} !important; }
          
          /* Further reduce line height */
          .print-content, .print-content p, .print-content div, .print-content span, .print-content li {
            line-height: 1.1 !important;
          }
        }
      </style>
    </head>
    <body class="${vacationBodyClass}">
      <div class="print-wrapper">
        <div class="print-header">
          <h1 class="print-title">${noteTitle}</h1>
          <div class="print-meta">
            <span class="print-category">${note.category || 'Uncategorized'}</span>
            <span>Created: ${createdDate}</span>
            <span> · </span>
            <span>Updated: ${updatedDate}</span>
          </div>
          ${tagsHtml}
        </div>
        
        ${summaryHtml}
        
        <div class="print-content ${isVacationNote ? '' : 'print-justified'}">
          ${enhancedContent}
        </div>
        
        ${conclusionHtml}
      </div>
      
      <div class="print-footer">
        <!-- Empty footer with just page numbers via CSS -->
      </div>
    </body>
    </html>
  `;
};
