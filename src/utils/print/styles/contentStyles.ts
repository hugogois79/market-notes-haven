
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
    
    /* Heading styles for print */
    .print-content h1 {
      font-size: 16pt;
      font-weight: 600;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .print-content h2 {
      font-size: 14pt;
      font-weight: 500;
      margin-top: 0.75rem;
      margin-bottom: 0.5rem;
    }
    
    .print-content h3 {
      font-size: 12pt;
      font-weight: 500;
      margin-top: 0.5rem;
      margin-bottom: 0.25rem;
    }
    
    .print-content b,
    .print-content strong {
      font-weight: 600;
    }
    
    /* Hide elements that don't print well */
    .print-content iframe, 
    .print-content video {
      display: none;
    }
  `;
};
