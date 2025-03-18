
/**
 * Styles for special sections like summary and conclusion
 */
export const getSpecialSectionStyles = (): string => {
  return `
    /* Summary styles */
    .print-summary {
      background-color: #E9F2FF;
      border-radius: 8px;
      padding: 16px;
      margin-top: 10px;
      margin-bottom: 24px;
      color: #333;
      page-break-inside: avoid;
      border: 1px solid #D3E4FD;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      display: block !important;
    }
    
    .print-summary-header {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 12pt;
      color: #1967d2;
      margin-bottom: 10px;
    }
    
    .print-summary-icon {
      margin-right: 8px;
      color: #1967d2;
    }
    
    .print-summary-content {
      font-size: 10pt;
      line-height: 1.6;
    }
    
    .print-summary-highlight {
      color: #1967d2;
      font-weight: 600;
    }
    
    /* Conclusion styles */
    .print-conclusion {
      background-color: #F1F0FB;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      margin-bottom: 24px;
      color: #333;
      page-break-inside: avoid;
      border: 1px solid #E6E4F3;
    }
    
    .print-conclusion-header {
      font-weight: 600;
      font-size: 12pt;
      color: #1967d2;
      margin-top: 0;
      margin-bottom: 10px;
    }
    
    .print-conclusion-content {
      font-size: 10pt;
      line-height: 1.6;
    }
  `;
};
