
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
      border-left: 2px solid #ddd;
      padding-left: 8px;
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
      font-weight: inherit; /* Inherit font weight from parent */
    }
    
    .print-content u,
    .print-content [style*="text-decoration: underline"] {
      text-decoration: underline;
      font-weight: inherit; /* Inherit font weight from parent */
    }
    
    /* Heading styles for print */
    .print-content h1 {
      font-size: 12pt;
      font-weight: 600;
      margin-top: 0.8rem;
      margin-bottom: 0.4rem;
    }
    
    .print-content h2 {
      font-size: 11pt;
      font-weight: 500;
      margin-top: 0.6rem;
      margin-bottom: 0.4rem;
    }
    
    .print-content h3 {
      font-size: 10pt;
      font-weight: 500;
      margin-top: 0.4rem;
      margin-bottom: 0.2rem;
    }
    
    /* Normal text should be normal weight */
    .print-content p, 
    .print-content div, 
    .print-content li,
    .print-content span,
    .print-content td {
      font-size: 9pt;
      font-weight: normal;
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
      padding-left: 15px;
      margin: 5px 0;
    }
    
    .print-content li {
      margin-bottom: 2px;
    }
  `;
};
