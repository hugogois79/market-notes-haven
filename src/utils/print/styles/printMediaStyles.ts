
/**
 * Media query styles specifically for print
 */
export const getPrintMediaStyles = (): string => {
  return `
    @page {
      margin: 1cm;
    }
    
    @media print {
      body {
        padding: 0;
        font-size: 10pt;
      }
      
      .print-title {
        font-size: 14pt;
      }
      
      .print-content {
        font-size: 9.5pt;
        margin-bottom: 40px; /* Reduced space for footer */
      }
      
      .print-summary {
        background-color: #D3E4FD !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin-bottom: 16px;
      }
      
      .print-summary-header {
        color: #1967d2 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .print-summary-highlight {
        color: #1967d2 !important;
        font-weight: 600 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Conclusion print styles */
      .print-conclusion {
        background-color: #D3E4FD !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin-top: 16px;
        margin-bottom: 16px;
      }
      
      .print-conclusion-header {
        color: #1967d2 !important;
        font-weight: 600 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .print-content table {
        page-break-inside: avoid;
      }
      
      /* Only apply background color to th elements in print */
      .print-content th {
        background-color: #f3f4f6 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Ensure all table data cells have white background */
      .print-content td {
        background-color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .print-footer {
        position: fixed;
        bottom: 20px;
        left: 0;
        right: 0;
        font-size: 8pt;
        color: #666;
        text-align: center;
        background-color: white;
        border-top: 1px solid #eee;
        padding-top: 8px;
        z-index: 999;
        max-width: 50%; /* Make footer less wide */
        margin-left: auto;
        margin-right: auto;
        white-space: nowrap; /* Prevent line breaks */
        overflow: hidden; /* Hide overflow text */
        text-overflow: ellipsis; /* Show ellipsis for overflow */
      }
      
      /* Enhanced text alignment support for print */
      .text-justify, 
      .print-content .text-justify,
      *[class*="text-justify"],
      [style*="text-align: justify"] {
        text-align: justify !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .text-center, 
      .print-content .text-center,
      *[class*="text-center"],
      [style*="text-align: center"] {
        text-align: center !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .text-right, 
      .print-content .text-right,
      *[class*="text-right"],
      [style*="text-align: right"] {
        text-align: right !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .text-left, 
      .print-content .text-left,
      *[class*="text-left"],
      [style*="text-align: left"] {
        text-align: left !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Force justification to work for paragraphs, lists, and table cells */
      p.text-justify, div.text-justify, li.text-justify, td.text-justify, th.text-justify {
        text-align: justify !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
};
