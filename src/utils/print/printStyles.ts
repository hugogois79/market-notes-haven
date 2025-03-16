
/**
 * Returns CSS styles for the print window
 */
export const getPrintStyles = (): string => {
  return `
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.4;
        color: #333;
        padding: 30px;
        max-width: 800px;
        margin: 0 auto;
        font-size: 10pt;
      }
      
      .print-header {
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
        margin-bottom: 15px;
      }
      
      .print-title {
        font-size: 16pt;
        font-weight: bold;
        margin-bottom: 8px;
      }
      
      .print-meta {
        font-size: 9pt;
        color: #666;
        margin-bottom: 10px;
      }
      
      .print-category {
        display: inline-block;
        font-size: 8pt;
        background-color: #f0f0f0;
        padding: 3px 8px;
        border-radius: 12px;
        margin-right: 8px;
      }
      
      .print-tags {
        margin-bottom: 20px;
      }
      
      .print-tag {
        display: inline-block;
        font-size: 8pt;
        background-color: #e8f0fe;
        color: #1967d2;
        padding: 2px 6px;
        border-radius: 12px;
        margin-right: 4px;
        margin-bottom: 4px;
      }
      
      .print-content {
        font-size: 10pt;
        margin-bottom: 40px; /* Reduced space for footer */
      }
      
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
        font-size: 14pt;
        font-weight: 600;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }
      
      .print-content h2 {
        font-size: 12pt;
        font-weight: 500;
        margin-top: 0.75rem;
        margin-bottom: 0.5rem;
      }
      
      .print-content h3 {
        font-size: 10.5pt;
        font-weight: 500;
        margin-top: 0.5rem;
        margin-bottom: 0.25rem;
      }
      
      .print-content b,
      .print-content strong {
        font-weight: 600;
      }
      
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
      
      /* Hide elements that don't print well */
      .print-content iframe, 
      .print-content video {
        display: none;
      }
      
      .print-footer {
        margin-top: 20px;
        font-size: 8pt;
        color: #888;
        text-align: center;
        border-top: 1px solid #eee;
        padding-top: 10px;
        position: fixed;
        bottom: 20px;
        left: 0;
        right: 0;
        background-color: white; /* Ensure footer has white background */
        z-index: 100; /* Keep the footer above content */
        max-width: 50%; /* Make footer less wide */
        margin-left: auto;
        margin-right: auto;
      }
      
      /* Add page number display */
      @page {
        margin: 1cm;
      }
      
      /* Text alignment classes */
      .print-content .text-left {
        text-align: left !important;
      }
      
      .print-content .text-center {
        text-align: center !important;
      }
      
      .print-content .text-right {
        text-align: right !important;
      }
      
      .print-content .text-justify {
        text-align: justify !important;
      }
      
      /* Ensure inline style text alignments are preserved */
      .print-content [style*="text-align: left"] {
        text-align: left !important;
      }
      
      .print-content [style*="text-align: center"] {
        text-align: center !important;
      }
      
      .print-content [style*="text-align: right"] {
        text-align: right !important;
      }
      
      .print-content [style*="text-align: justify"] {
        text-align: justify !important;
      }
      
      /* Print-specific adjustments */
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
        
        .print-footer::after {
          content: "Page " counter(page);
          display: inline; /* Changed from block to inline */
        }
        
        /* Ensure text alignment styles are preserved in print */
        [style*="text-align: justify"] {
          text-align: justify !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        [style*="text-align: center"] {
          text-align: center !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        [style*="text-align: right"] {
          text-align: right !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        [style*="text-align: left"] {
          text-align: left !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Additional helper classes for text alignment */
        .text-justify {
          text-align: justify !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .text-center {
          text-align: center !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .text-right {
          text-align: right !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .text-left {
          text-align: left !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    </style>
  `;
};
