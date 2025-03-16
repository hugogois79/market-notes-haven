
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
      
      <div class="print-content">
        ${processedContent}
      </div>
      
      <div class="print-footer">
        GVVC MarketNotes
      </div>
    </body>
    </html>
  `;
};
