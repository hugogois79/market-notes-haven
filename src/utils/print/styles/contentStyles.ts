
/**
 * Styles for content elements like images, blockquotes, tables, etc.
 */
export const getContentStyles = (): string => {
  return `
    .print-content img {
      max-width: 100%;
      height: auto;
    }
    
    .print-content blockquote {
      border-left: 1px solid #ddd;
      padding-left: 4px;
      margin-left: 0;
      color: #666;
      font-style: italic;
      font-weight: normal;
    }
    
    /* Preserve formatting for highlighted and underlined text */
    .print-content .highlight,
    .print-content [style*="background-color: #FEF7CD"] {
      background-color: #FEF7CD;
      border-bottom: 1px solid #FEF7CD;
      font-weight: inherit;
    }
    
    .print-content u,
    .print-content [style*="text-decoration: underline"] {
      text-decoration: underline;
      font-weight: inherit;
    }
    
    /* Heading styles for print */
    .print-content h1 {
      font-size: 9.5pt;
      font-weight: 600;
      margin-top: 0.4rem;
      margin-bottom: 0.2rem;
    }
    
    .print-content h2 {
      font-size: 8.5pt;
      font-weight: 500;
      margin-top: 0.3rem;
      margin-bottom: 0.2rem;
    }
    
    .print-content h3 {
      font-size: 8pt;
      font-weight: 500;
      margin-top: 0.2rem;
      margin-bottom: 0.1rem;
    }
    
    /* Normal text should be normal weight */
    .print-content p, 
    .print-content div, 
    .print-content li,
    .print-content span,
    .print-content td {
      font-size: 7.5pt;
      font-weight: normal;
      line-height: 1.2;
    }
    
    /* Only make actual bold elements bold */
    .print-content b,
    .print-content strong {
      font-weight: 600;
    }
    
    /* Hide elements that don't print well */
    .print-content iframe, 
    .print-content video {
      display: none;
    }
    
    /* Adjust list spacing for printing */
    .print-content ul,
    .print-content ol {
      padding-left: 10px;
      margin: 2px 0;
    }
    
    .print-content li {
      margin-bottom: 1px;
    }
  `;
};
