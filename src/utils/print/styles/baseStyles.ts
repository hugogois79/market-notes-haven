
/**
 * Base styles for print layout
 */
export const getBaseStyles = (): string => {
  return `
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.3;
      color: #333;
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
      font-size: 8.5pt;
      font-weight: normal; /* Explicitly set normal font weight for body */
    }
    
    .print-header {
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    .print-title {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .print-meta {
      font-size: 7.5pt;
      color: #666;
      margin-bottom: 6px;
      font-weight: normal;
    }
    
    .print-category {
      display: inline-block;
      font-size: 7pt;
      background-color: #f0f0f0;
      padding: 1.5px 5px;
      border-radius: 8px;
      margin-right: 5px;
      font-weight: normal;
    }
    
    .print-tags {
      margin-bottom: 12px;
    }
    
    .print-tag {
      display: inline-block;
      font-size: 6.5pt;
      background-color: #e8f0fe;
      color: #1967d2;
      padding: 1px 4px;
      border-radius: 8px;
      margin-right: 3px;
      margin-bottom: 2px;
      font-weight: normal;
    }
    
    .print-content {
      font-size: 8.5pt;
      margin-bottom: 24px; /* Reduced space for footer */
      font-weight: normal; /* Explicitly set normal font weight for content */
    }
    
    /* Ensure paragraphs have normal weight by default */
    .print-content p {
      font-weight: normal;
    }
    
    .print-footer {
      margin-top: 12px;
      font-size: 6.5pt;
      color: #888;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 6px;
      position: fixed;
      bottom: 12px;
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
