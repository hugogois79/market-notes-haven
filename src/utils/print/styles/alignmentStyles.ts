
/**
 * Styles for text alignment
 */
export const getAlignmentStyles = (): string => {
  return `
    /* Text alignment classes - enhanced for better print support */
    .print-content .text-left,
    .print-content [style*="text-align: left"] {
      text-align: left !important;
    }
    
    .print-content .text-center,
    .print-content [style*="text-align: center"] {
      text-align: center !important;
    }
    
    .print-content .text-right,
    .print-content [style*="text-align: right"] {
      text-align: right !important;
    }
    
    /* Stronger justification rules */
    .print-content .text-justify,
    .print-content [style*="text-align: justify"],
    .print-justified p,
    .print-justified div {
      text-align: justify !important;
    }
    
    /* More specific selectors to ensure styles apply even in print */
    .print-content p.text-justify, 
    .print-content div.text-justify, 
    .print-content li.text-justify, 
    .print-content td.text-justify, 
    .print-content th.text-justify,
    .print-content p[style*="text-align: justify"], 
    .print-content div[style*="text-align: justify"], 
    .print-content li[style*="text-align: justify"], 
    .print-content td[style*="text-align: justify"], 
    .print-content th[style*="text-align: justify"] {
      text-align: justify !important;
    }
    
    /* Force justification for paragraphs in print mode */
    @media print {
      .print-justified p {
        text-align: justify !important;
      }
    }
  `;
};
