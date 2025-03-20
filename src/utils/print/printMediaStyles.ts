
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
        font-size: 12pt;
        font-weight: normal;
      }
      
      .print-title {
        font-size: 16pt;
        font-weight: bold;
      }
      
      .print-content {
        font-size: 11pt;
        margin-bottom: 40px; /* Reduced space for footer */
        font-weight: normal;
      }
      
      /* Reset font weight for all elements by default */
      *, body, div, p, span, td, th, li, ul, ol {
        font-weight: normal;
      }
      
      /* Only allow explicit bold elements to be bold */
      b, strong, h1, h2, h3, h4, h5, h6 {
        font-weight: bold !important;
      }
      
      /* Class to enforce justification throughout the document */
      .print-justified p, 
      .print-justified div, 
      .print-justified li {
        text-align: justify !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-weight: normal;
      }
      
      /* Make sure summary displays with correct colors */
      .print-summary {
        background-color: #E9F2FF !important;
        border: 1px solid #D3E4FD !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin-bottom: 20px;
        margin-top: 10px;
        display: block !important;
        visibility: visible !important;
        font-weight: normal;
      }
      
      .print-summary-header {
        color: #1967d2 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-weight: bold;
      }
      
      .print-summary-content {
        font-weight: normal;
      }
      
      .print-summary-highlight {
        color: #1967d2 !important;
        font-weight: 600 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Conclusion print styles */
      .print-conclusion {
        background-color: #F1F0FB !important;
        border: 1px solid #E6E4F3 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin-top: 20px;
        margin-bottom: 20px;
        font-weight: normal;
      }
      
      .print-conclusion-header {
        color: #1967d2 !important;
        font-weight: 600 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .print-conclusion-content {
        font-weight: normal;
      }
      
      /* More aggressive justification for print content */
      .print-justified p, 
      .print-justified div:not(.print-title):not(.print-meta):not(.print-tags):not(.print-category),
      .print-justified li {
        text-align: justify !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-weight: normal;
      }
      
      .print-content table {
        page-break-inside: avoid;
      }
      
      /* Only apply background color to th elements in print */
      .print-content th {
        background-color: #f3f4f6 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-weight: 600;
      }
      
      /* Ensure all table data cells have white background */
      .print-content td {
        background-color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-weight: normal;
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
        font-weight: normal;
      }
      
      /* Regular paragraphs should have normal font weight */
      p, div, span, li, td {
        font-weight: normal !important;
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
    }
  `;
};
