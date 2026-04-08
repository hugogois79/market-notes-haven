
/**
 * Styles for tables
 */
export const getTableStyles = (): string => {
  return `
    /* Improved table styling with distinct borders */
    .print-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.8rem 0;
      font-size: 9pt;
      border: 1px solid #ccc;
    }
    
    .print-content th, 
    .print-content td {
      border: 1px solid #ccc;
      padding: 4px 6px;
      text-align: left;
    }
    
    /* Only apply background color to th elements (table headers), not the first row */
    .print-content th {
      background-color: #f3f4f6 !important;
      font-weight: 600;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Ensure all table data cells have white background */
    .print-content td {
      background-color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  `;
};
