
import React from "react";

/**
 * Styles for the editor content, applied globally to ensure consistent appearance
 */
const ContentStyles = () => {
  return (
    <style>
      {`
        .editor-content {
          line-height: 1.3;
          font-size: 14px;
          padding-bottom: 120px;
        }
        
        .editor-content h1 {
          font-size: 1.8em;
          font-weight: bold;
          margin: 0.8rem 0 0.4rem;
        }
        
        .editor-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.6rem 0 0.3rem;
        }
        
        .editor-content h3 {
          font-size: 1.2em;
          font-weight: bold;
          margin: 0.4rem 0 0.2rem;
        }
        
        .editor-content p {
          margin: 0.2rem 0;
        }
        
        .editor-content ul {
          list-style-type: disc !important;
          margin: 0.3rem 0;
          padding-left: 2rem;
          display: block;
        }
        
        .editor-content ol {
          list-style-type: decimal !important;
          margin: 0.3rem 0;
          padding-left: 2rem;
          counter-reset: item;
          display: block;
        }
        
        .editor-content li {
          display: list-item !important;
          margin: 0.1rem 0;
        }
        
        .editor-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.5rem 0;
        }
        
        .editor-content th, .editor-content td {
          border: 1px solid #ccc;
          padding: 8px;
        }
        
        .editor-content th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        .editor-content blockquote {
          border-left: 3px solid #ccc;
          margin: 0.5rem 0;
          padding-left: 1rem;
          font-style: italic;
          color: #555;
        }
        
        .editor-content hr {
          border: none;
          border-top: 1px solid #ccc;
          margin: 0.5rem 0;
        }
        
        .editor-content a {
          color: #0066cc;
          text-decoration: underline;
        }
        
        .editor-content .conclusion-heading {
          color: #2E7D32;
          border-bottom: 1px solid #2E7D32;
          padding-bottom: 0.2rem;
        }
        
        .editor-content .conclusion-content {
          background-color: #F1F8E9;
          padding: 0.5rem;
          border-left: 3px solid #2E7D32;
        }
        
        .editor-content .implementation-heading {
          color: #1565C0;
          border-bottom: 1px solid #1565C0;
          padding-bottom: 0.2rem;
        }
        
        .editor-content .restart-heading {
          color: #C62828;
          border-bottom: 1px solid #C62828;
          padding-bottom: 0.2rem;
        }
        
        .editor-content input[type="checkbox"] {
          margin-right: 0.5rem;
        }
        
        .editor-content .checkbox-item {
          display: flex;
          align-items: flex-start;
          margin: 0.15rem 0;
        }
        
        .editor-content .checkbox-label {
          display: inline-block;
          margin-left: 0.5rem;
        }
        
        .editor-content .editor-separator {
          width: 100%;
          margin: 1rem 0;
          text-align: center;
          position: relative;
          clear: both;
        }
        
        .editor-content .editor-separator hr {
          border: none;
          height: 1px;
          background-color: #d1d5db;
          margin: 0;
        }
      `}
    </style>
  );
};

export default ContentStyles;
