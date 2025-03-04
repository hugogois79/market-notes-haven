
import { Note } from "@/types";

/**
 * Formats a date string for display
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Handles printing a note
 */
export const printNote = (note: Note): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    console.error('Could not open print window - popup blocker?');
    return;
  }
  
  // Set up print styles - these will only apply to the print window
  const printStyles = `
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        color: #333;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .print-header {
        border-bottom: 1px solid #eee;
        padding-bottom: 20px;
        margin-bottom: 20px;
      }
      
      .print-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .print-meta {
        font-size: 14px;
        color: #666;
        margin-bottom: 15px;
      }
      
      .print-category {
        display: inline-block;
        font-size: 12px;
        background-color: #f0f0f0;
        padding: 4px 10px;
        border-radius: 20px;
        margin-right: 10px;
      }
      
      .print-tags {
        margin-bottom: 30px;
      }
      
      .print-tag {
        display: inline-block;
        font-size: 12px;
        background-color: #e8f0fe;
        color: #1967d2;
        padding: 3px 8px;
        border-radius: 20px;
        margin-right: 5px;
        margin-bottom: 5px;
      }
      
      .print-content {
        font-size: 16px;
      }
      
      .print-content img {
        max-width: 100%;
        height: auto;
      }
      
      .print-content blockquote {
        border-left: 3px solid #ddd;
        padding-left: 15px;
        margin-left: 0;
        color: #666;
      }
      
      /* Hide elements that don't print well */
      .print-content iframe, 
      .print-content video {
        display: none;
      }
      
      .print-footer {
        margin-top: 40px;
        font-size: 12px;
        color: #888;
        text-align: center;
        border-top: 1px solid #eee;
        padding-top: 15px;
      }
      
      @media print {
        body {
          padding: 0;
        }
      }
    </style>
  `;
  
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
  
  // Create the complete HTML document for printing
  const printContent = `
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
        ${note.content}
      </div>
      
      <div class="print-footer">
        Printed from Notes App
      </div>
    </body>
    </html>
  `;
  
  // Write the content to the new window and trigger printing
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for images to load before printing
  printWindow.onload = () => {
    // Trigger the print dialog
    printWindow.print();
    
    // Close the window after printing (some browsers may do this automatically)
    // Set a timeout to avoid closing before print dialog appears
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 500);
  };
};
