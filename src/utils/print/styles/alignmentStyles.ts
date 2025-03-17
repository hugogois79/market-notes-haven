
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
    
    .print-content .text-justify,
    .print-content [style*="text-align: justify"] {
      text-align: justify !important;
    }
  `;
};
