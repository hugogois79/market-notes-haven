
/**
 * Styles for special sections like summary and conclusion
 */
export const getSpecialSectionStyles = (): string => {
  return `
    /* Summary styles */
    .print-summary {
      background-color: #D3E4FD;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      color: #333;
      page-break-inside: avoid;
    }
    
    .print-summary-header {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 11pt;
      color: #1967d2;
      margin-bottom: 8px;
    }
    
    .print-summary-icon {
      margin-right: 6px;
      color: #1967d2;
    }
    
    .print-summary-content {
      font-size: 9.5pt;
      line-height: 1.5;
    }
    
    .print-summary-highlight {
      color: #1967d2;
      font-weight: 600;
    }
    
    /* Conclusion styles */
    .print-conclusion {
      background-color: #D3E4FD;
      border-radius: 8px;
      padding: 12px;
      margin-top: 20px;
      margin-bottom: 20px;
      color: #333;
      page-break-inside: avoid;
    }
    
    .print-conclusion-header {
      font-weight: 600;
      font-size: 11pt;
      color: #1967d2;
      margin-top: 0;
      margin-bottom: 8px;
    }
    
    .print-conclusion-content {
      font-size: 9.5pt;
      line-height: 1.5;
    }
  `;
};
