
/**
 * Base styles for print layout
 */
export const getBaseStyles = (): string => {
  return `
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
      margin-bottom: 40px; /* Reduced space for footer */
    }
    
    .print-footer {
      margin-top: 20px;
      font-size: 8pt;
      color: #888;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 10px;
      position: fixed;
      bottom: 20px;
      left: 0;
      right: 0;
      background-color: white; /* Ensure footer has white background */
      z-index: 100; /* Keep the footer above content */
      max-width: 50%; /* Make footer less wide */
      margin-left: auto;
      margin-right: auto;
    }
  `;
};
