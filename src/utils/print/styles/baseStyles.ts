
/**
 * Base styles for print layout
 */
export const getBaseStyles = (): string => {
  return `
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.2;
      color: #333;
      padding: 12px;
      max-width: 800px;
      margin: 0 auto;
      font-size: 7.5pt;
      font-weight: normal;
    }
    
    .print-header {
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    
    .print-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 3px;
    }
    
    .print-meta {
      font-size: 6.5pt;
      color: #666;
      margin-bottom: 3px;
      font-weight: normal;
    }
    
    .print-category {
      display: inline-block;
      font-size: 6pt;
      background-color: #f0f0f0;
      padding: 1px 4px;
      border-radius: 6px;
      margin-right: 4px;
      font-weight: normal;
    }
    
    .print-tags {
      margin-bottom: 6px;
    }
    
    .print-tag {
      display: inline-block;
      font-size: 5.5pt;
      background-color: #e8f0fe;
      color: #1967d2;
      padding: 1px 3px;
      border-radius: 6px;
      margin-right: 2px;
      margin-bottom: 1px;
      font-weight: normal;
    }
    
    .print-content {
      font-size: 7.5pt;
      margin-bottom: 16px;
      font-weight: normal;
    }
    
    /* Ensure paragraphs have normal weight by default */
    .print-content p {
      font-weight: normal;
    }
    
    .print-footer {
      margin-top: 6px;
      font-size: 5.5pt;
      color: #888;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 3px;
      position: fixed;
      bottom: 6px;
      left: 0;
      right: 0;
      background-color: white;
      z-index: 100;
      max-width: 50%;
      margin-left: auto;
      margin-right: auto;
      font-weight: normal;
    }
  `;
};
