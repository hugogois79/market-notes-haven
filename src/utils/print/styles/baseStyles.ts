
/**
 * Base styles for print layout
 */
export const getBaseStyles = (): string => {
  return `
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      font-size: 9pt;
      font-weight: normal; /* Explicitly set normal font weight for body */
    }
    
    .print-header {
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    
    .print-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 6px;
    }
    
    .print-meta {
      font-size: 8pt;
      color: #666;
      margin-bottom: 8px;
      font-weight: normal;
    }
    
    .print-category {
      display: inline-block;
      font-size: 7pt;
      background-color: #f0f0f0;
      padding: 2px 6px;
      border-radius: 10px;
      margin-right: 6px;
      font-weight: normal;
    }
    
    .print-tags {
      margin-bottom: 15px;
    }
    
    .print-tag {
      display: inline-block;
      font-size: 7pt;
      background-color: #e8f0fe;
      color: #1967d2;
      padding: 1px 5px;
      border-radius: 10px;
      margin-right: 3px;
      margin-bottom: 3px;
      font-weight: normal;
    }
    
    .print-content {
      font-size: 9pt;
      margin-bottom: 30px; /* Reduced space for footer */
      font-weight: normal; /* Explicitly set normal font weight for content */
    }
    
    /* Ensure paragraphs have normal weight by default */
    .print-content p {
      font-weight: normal;
    }
    
    .print-footer {
      margin-top: 15px;
      font-size: 7pt;
      color: #888;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 8px;
      position: fixed;
      bottom: 15px;
      left: 0;
      right: 0;
      background-color: white; /* Ensure footer has white background */
      z-index: 100; /* Keep the footer above content */
      max-width: 50%; /* Make footer less wide */
      margin-left: auto;
      margin-right: auto;
      font-weight: normal;
    }
  `;
};
