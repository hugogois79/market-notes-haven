/**
 * Media query styles specifically for print
 */
export const getPrintMediaStyles = (): string => {
  return `
    @page {
      margin: 0.6cm;
    }
    
    @media print {
      body {
        padding: 0;
        font-size: 8pt;
        font-weight: normal;
      }
      
      .print-title {
        font-size: 18pt;
        font-weight: bold;
      }
      
      .print-content {
        font-size: 8pt;
        margin-bottom: 20px;
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
      
      /* Heading styles with more distinct size differences */
      .print-content h1, h1 {
        font-size: 18pt !important;
        font-weight: 700 !important;
        text-decoration: underline !important;
        margin-top: 0.8rem !important;
        margin-bottom: 0.5rem !important;
      }
      
      .print-content h2, h2 {
        font-size: 14pt !important;
        font-weight: 600 !important;
        margin-top: 0.6rem !important;
        margin-bottom: 0.4rem !important;
      }
      
      .print-content h3, h3 {
        font-size: 12pt !important;
        font-weight: 500 !important;
        margin-top: 0.4rem !important;
        margin-bottom: 0.3rem !important;
      }
      
      /* Bullet points should be smaller and tighter */
      .print-content ul,
      .print-content ol {
        padding-left: 10px;
        margin: 2px 0;
      }
      
      .print-content li {
        margin-bottom: 1px;
        font-size: 8pt;
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
        margin-bottom: 8px;
        margin-top: 4px;
        display: block !important;
        visibility: visible !important;
        font-weight: normal;
        padding: 4px;
      }
      
      .print-summary-header {
        color: #1967d2 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-weight: bold;
        font-size: 8pt;
      }
      
      .print-summary-content {
        font-weight: normal;
        font-size: 8pt;
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
        margin-top: 8px;
        margin-bottom: 8px;
        font-weight: normal;
        padding: 4px;
      }
      
      .print-conclusion-header {
        color: #1967d2 !important;
        font-weight: 600 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-size: 8pt;
      }
      
      .print-conclusion-content {
        font-weight: normal;
        font-size: 8pt;
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
        font-size: 7pt;
        padding: 2px;
      }
      
      /* Ensure all table data cells have white background */
      .print-content td {
        background-color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-weight: normal;
        font-size: 7pt;
        padding: 2px;
      }
      
      .print-footer {
        position: fixed;
        bottom: 8px;
        left: 0;
        right: 0;
        font-size: 6pt;
        color: #666;
        text-align: center;
        background-color: white;
        border-top: 1px solid #eee;
        padding-top: 3px;
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
        font-size: 8pt;
        margin-top: 0;
        margin-bottom: 0.05rem;
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
