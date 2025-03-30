
import React from "react";

/**
 * Defines styles for the editor content
 */
const ContentStyles: React.FC = () => {
  return (
    <style>{`
      [contenteditable="true"] h1 {
        font-size: 1.4rem;
        font-weight: 600;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }
      [contenteditable="true"] h2 {
        font-size: 1.25rem;
        font-weight: 500;
        margin-top: 0.75rem;
        margin-bottom: 0.5rem;
      }
      [contenteditable="true"] h3 {
        font-size: 1.1rem;
        font-weight: 500;
        margin-top: 0.5rem;
        margin-bottom: 0.25rem;
      }
      [contenteditable="true"] p {
        font-size: 1rem;
        margin-bottom: 0.5rem;
      }
      [contenteditable="true"] ul {
        list-style-type: disc;
        padding-left: 2rem;
        margin: 0.5rem 0;
      }
      [contenteditable="true"] ol {
        list-style-type: decimal;
        padding-left: 2rem;
        margin: 0.5rem 0;
      }
      [contenteditable="true"] li {
        margin-bottom: 0.25rem;
        font-size: 1rem;
      }
      [contenteditable="true"] table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
        table-layout: fixed;
      }
      [contenteditable="true"] th, 
      [contenteditable="true"] td {
        border: 1px solid #d1d5db;
        padding: 0.5rem;
        font-size: 1rem;
        max-width: 100%;
        overflow-wrap: break-word;
        word-wrap: break-word;
      }
      [contenteditable="true"] th {
        background-color: #f3f4f6;
        font-weight: bold;
      }
      [contenteditable="true"] .text-left {
        text-align: left;
      }
      [contenteditable="true"] .text-center {
        text-align: center;
      }
      [contenteditable="true"] .text-right {
        text-align: right;
      }
      [contenteditable="true"] .text-justify {
        text-align: justify;
      }
      [contenteditable="true"] .chapter-separator {
        width: 100%;
        margin: 1.5rem 0;
        text-align: center;
        position: relative;
        overflow: hidden;
        height: 20px;
      }
      [contenteditable="true"] .chapter-separator hr {
        margin: 0;
        border: none;
        border-top: 1px solid #d1d5db;
      }
      [contenteditable="true"] .highlight {
        background-color: #FEF7CD;
        border-bottom: 2px solid #FEF7CD;
      }
      [contenteditable="true"] b,
      [contenteditable="true"] strong {
        font-weight: 600;
      }
      
      /* Styling for conclusion section */
      [contenteditable="true"] .conclusion-heading {
        color: #1967d2;
      }
      
      [contenteditable="true"] .conclusion-content {
        background-color: #D3E4FD;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      /* Styling for no-conclusion wrapper */
      [contenteditable="true"] .no-conclusion-wrapper {
        background-color: #D3E4FD;
        padding: 12px;
        border-radius: 4px;
        margin-top: 8px;
        margin-bottom: 8px;
      }
      
      [contenteditable="true"] .conclusion-missing-note {
        background-color: #1967d2;
        color: white;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 8px;
        font-size: 12px;
        font-weight: bold;
      }
      
      /* Enhanced checkbox styling */
      [contenteditable="true"] .checkbox-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.5rem;
        gap: 0.5rem;
      }
      
      [contenteditable="true"] .editor-checkbox {
        margin-top: 0.25rem;
        cursor: pointer;
        width: 1rem;
        height: 1rem;
      }
      
      [contenteditable="true"] .checkbox-label {
        flex: 1;
        min-width: 0;
      }
      
      /* Restart conditions and Implementation Checklist styling */
      [contenteditable="true"] ol li {
        padding-left: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      [contenteditable="true"] hr {
        border: none;
        border-top: 1px solid #d1d5db;
        margin: 1rem 0;
      }
      
      /* Trading framework styling */
      [contenteditable="true"] .trading-framework {
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
        background-color: #f9fafb;
      }
      
      [contenteditable="true"] .trading-framework h2 {
        border-bottom: 1px solid #d1d5db;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
        color: #1967d2;
      }
    `}</style>
  );
};

export default ContentStyles;
