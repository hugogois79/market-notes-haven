
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
        line-height: 1.4;
        color: #333;
        padding: 30px;
        max-width: 800px;
        margin: 0 auto;
        font-size: 10pt;
      }
      
      .print-header {
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
        margin-bottom: 15px;
      }
      
      .print-title {
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .print-meta {
        font-size: 9pt;
        color: #666;
        margin-bottom: 10px;
      }
      
      .print-category {
        display: inline-block;
        font-size: 8pt;
        background-color: #f0f0f0;
        padding: 3px 8px;
        border-radius: 12px;
        margin-right: 8px;
      }
      
      .print-tags {
        margin-bottom: 20px;
      }
      
      .print-tag {
        display: inline-block;
        font-size: 8pt;
        background-color: #e8f0fe;
        color: #1967d2;
        padding: 2px 6px;
        border-radius: 12px;
        margin-right: 4px;
        margin-bottom: 4px;
      }
      
      .print-content {
        font-size: 10pt;
      }
      
      .print-content img {
        max-width: 100%;
        height: auto;
      }
      
      .print-content blockquote {
        border-left: 2px solid #ddd;
        padding-left: 10px;
        margin-left: 0;
        color: #666;
        font-style: italic;
      }
      
      /* Preserve formatting for highlighted and underlined text */
      .print-content .highlight,
      .print-content [style*="background-color: #FEF7CD"] {
        background-color: #FEF7CD;
        border-bottom: 1px solid #FEF7CD;
      }
      
      .print-content u,
      .print-content [style*="text-decoration: underline"] {
        text-decoration: underline;
      }
      
      /* Improved table styling with distinct borders */
      .print-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 0.8rem 0;
        font-size: 9pt;
        border: 1px solid #ccc;
      }
      
      .print-content th, 
      .print-content td {
        border: 1px solid #ccc;
        padding: 4px 6px;
        text-align: left;
      }
      
      .print-content th,
      .print-content tr:first-child td {
        background-color: #f3f4f6 !important;
        font-weight: 600;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .print-content tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      
      /* Hide elements that don't print well */
      .print-content iframe, 
      .print-content video {
        display: none;
      }
      
      .print-footer {
        margin-top: 30px;
        font-size: 8pt;
        color: #888;
        text-align: center;
        border-top: 1px solid #eee;
        padding-top: 10px;
      }
      
      /* Text alignment classes */
      .print-content .text-left {
        text-align: left;
      }
      
      .print-content .text-center {
        text-align: center;
      }
      
      .print-content .text-right {
        text-align: right;
      }
      
      .print-content .text-justify {
        text-align: justify;
      }
      
      /* Print-specific adjustments */
      @media print {
        body {
          padding: 0;
          font-size: 10pt;
        }
        
        .print-title {
          font-size: 14pt;
        }
        
        .print-content {
          font-size: 9.5pt;
        }
        
        .print-content table {
          page-break-inside: avoid;
        }
        
        .print-content th,
        .print-content tr:first-child td {
          background-color: #f3f4f6 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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

  // Process content to ensure HTML is preserved exactly as it is
  const processedContent = note.content;
  
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
        ${processedContent}
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
