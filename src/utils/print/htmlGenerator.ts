
import { Note } from "@/types";
import { formatDate } from "./formatUtils";
import { getPrintStyles } from "./printStyles";

/**
 * Generates HTML for the print window
 */
export const generatePrintHtml = (note: Note): string => {
  // Format created/updated dates
  const createdDate = formatDate(note.createdAt);
  const updatedDate = formatDate(note.updatedAt);
  
  // Format tags
  const tagsHtml = note.tags.length > 0 
    ? `
      <div class="print-tags">
        ${note.tags.map(tag => `<span class="print-tag">${tag}</span>`).join(' ')}
      </div>
    ` 
    : '';

  // Process content to preserve HTML
  const processedContent = note.content;
  
  // Generate AI summary section if available
  const summaryHtml = note.summary 
    ? `
      <div class="print-summary">
        <div class="print-summary-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="print-summary-icon">
            <polygon points="12 3 20 12 12 21 4 12 12 3"></polygon>
          </svg>
          <span>AI Summary</span>
        </div>
        <div class="print-summary-content">
          ${note.summary.split('**').map((part, index) => {
            // If the index is odd, it's a bold part
            return index % 2 === 1 
              ? `<strong class="print-summary-highlight">${part}</strong>` 
              : part;
          }).join('')}
        </div>
      </div>
    `
    : '';
  
  // Get print styles
  const printStyles = getPrintStyles();
  
  // Create the complete HTML document for printing
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${note.title}</title>
      ${printStyles}
    </head>
    <body>
      <div class="print-wrapper">
        <div class="print-header">
          <h1 class="print-title">${note.title}</h1>
          <div class="print-meta">
            <span class="print-category">${note.category}</span>
            <span>Created: ${createdDate}</span>
            <span> · </span>
            <span>Updated: ${updatedDate}</span>
          </div>
          ${tagsHtml}
        </div>
        
        ${summaryHtml}
        
        <div class="print-content">
          ${processedContent}
        </div>
      </div>
      
      <div class="print-footer">
        <!-- Empty footer with just page numbers via CSS -->
      </div>
    </body>
    </html>
  `;
};
