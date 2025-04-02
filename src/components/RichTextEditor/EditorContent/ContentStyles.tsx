
import React from "react";

/**
 * Defines styles for the editor content
 */
const ContentStyles: React.FC = () => {
  return (
    <style>{`
      [contenteditable="true"] h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-top: 0.8rem;
        margin-bottom: 0.4rem;
        text-decoration: underline;
        padding-bottom: 0.1rem;
        color: #000;
        line-height: 1.1;
      }
      [contenteditable="true"] h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 0.6rem;
        margin-bottom: 0.3rem;
        color: #000;
        line-height: 1.1;
      }
      [contenteditable="true"] h3 {
        font-size: 1.1rem;
        font-weight: 500;
        margin-top: 0.5rem;
        margin-bottom: 0.2rem;
        color: #000;
        line-height: 1;
      }
      [contenteditable="true"] p {
        font-size: 0.85rem;
        margin-bottom: 0.2rem;
        margin-top: 0;
        line-height: 1.2;
        max-width: 100%;
      }
      [contenteditable="true"] ul {
        list-style-type: disc;
        padding-left: 1rem;
        margin: 0.15rem 0;
      }
      [contenteditable="true"] ol {
        list-style-type: decimal;
        padding-left: 1rem;
        margin: 0.15rem 0;
      }
      [contenteditable="true"] li {
        margin-bottom: 0.1rem;
        font-size: 0.85rem;
        line-height: 1.2;
      }
      [contenteditable="true"] table {
        border-collapse: collapse;
        width: 100%;
        margin: 0.3rem 0;
        table-layout: fixed;
      }
      [contenteditable="true"] th, 
      [contenteditable="true"] td {
        border: 1px solid #d1d5db;
        padding: 0.3rem;
        font-size: 0.85rem;
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
        margin: 0.5rem 0;
        text-align: center;
        position: relative;
        overflow: hidden;
        height: 6px;
      }
      [contenteditable="true"] .chapter-separator hr {
        margin: 0;
        border: none;
        border-top: 1px solid #d1d5db;
      }
      [contenteditable="true"] .highlight {
        background-color: #FEF7CD;
        border-bottom: 1px solid #FEF7CD;
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
        padding: 0.3rem;
        border-radius: 3px;
        margin-bottom: 0.3rem;
      }
      
      /* Styling for no-conclusion wrapper */
      [contenteditable="true"] .no-conclusion-wrapper {
        background-color: #D3E4FD;
        padding: 0.3rem;
        border-radius: 3px;
        margin-top: 0.3rem;
        margin-bottom: 0.3rem;
      }
      
      [contenteditable="true"] .conclusion-missing-note {
        background-color: #1967d2;
        color: white;
        padding: 0.2rem;
        border-radius: 3px;
        margin-bottom: 0.2rem;
        font-size: 0.8rem;
        font-weight: bold;
      }
      
      /* Enhanced checkbox styling */
      [contenteditable="true"] .checkbox-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.1rem;
        gap: 0.15rem;
      }
      
      [contenteditable="true"] .editor-checkbox {
        margin-top: 0.05rem;
        cursor: pointer;
        width: 0.7rem;
        height: 0.7rem;
      }
      
      [contenteditable="true"] .checkbox-label {
        flex: 1;
        min-width: 0;
        font-size: 0.85rem;
      }
      
      /* Restart conditions and Implementation Checklist styling */
      [contenteditable="true"] ol li {
        padding-left: 0.1rem;
        margin-bottom: 0.1rem;
      }
      
      [contenteditable="true"] hr {
        border: none;
        border-top: 1px solid #d1d5db;
        margin: 0.3rem 0;
      }
      
      /* Trading framework styling */
      [contenteditable="true"] .trading-framework {
        border: 1px solid #d1d5db;
        border-radius: 3px;
        padding: 0.3rem;
        margin: 0.3rem 0;
        background-color: #f9fafb;
      }
      
      [contenteditable="true"] .trading-framework h2 {
        border-bottom: 1px solid #d1d5db;
        padding-bottom: 0.2rem;
        margin-bottom: 0.2rem;
        color: #1967d2;
      }
      
      /* Numbered list items in strategic considerations */
      [contenteditable="true"] ol.strategic-list {
        counter-reset: item;
        list-style-type: none;
        padding-left: 0;
      }
      
      [contenteditable="true"] ol.strategic-list > li {
        counter-increment: item;
        margin-bottom: 0.1rem;
        display: flex;
      }
      
      [contenteditable="true"] ol.strategic-list > li::before {
        content: counter(item) ".";
        font-weight: 600;
        padding-right: 0.2rem;
        min-width: 1rem;
        display: inline-block;
        text-align: right;
      }
      
      /* Compact section styling similar to Claude */
      [contenteditable="true"] .section-item {
        margin-bottom: 0.3rem;
      }
      
      [contenteditable="true"] .section-title {
        font-weight: 600;
        margin-bottom: 0.1rem;
      }
      
      [contenteditable="true"] .section-content {
        margin-left: 0.2rem;
      }
    `}</style>
  );
};

export default ContentStyles;
