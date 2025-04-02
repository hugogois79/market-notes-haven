
import React from "react";

/**
 * CSS styles for the editor content
 */
const ContentStyles = () => {
  return (
    <style jsx global>{`
      .editor-content h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }

      .editor-content h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 0.75rem;
        margin-bottom: 0.5rem;
      }
      
      .editor-content h3 {
        font-size: 1rem;
        font-weight: 500;
        margin-top: 0.75rem;
        margin-bottom: 0.25rem;
      }
      
      .editor-content p {
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
        line-height: 1.4;
      }

      .editor-content a {
        color: #2563eb;
        text-decoration: underline;
      }

      .editor-content blockquote {
        border-left: 3px solid #d1d5db;
        padding-left: 1rem;
        margin-left: 0;
        color: #4b5563;
        font-style: italic;
      }
      
      .editor-content ul {
        list-style-type: disc;
        padding-left: 1rem;
        margin: 0.15rem 0;
      }
      
      .editor-content ol {
        list-style-type: decimal;
        padding-left: 1rem;
        margin: 0.15rem 0;
        counter-reset: item;
      }
      
      .editor-content li {
        margin-bottom: 0.1rem;
        line-height: 1.2;
        font-size: 0.85rem;
        display: list-item;
      }
      
      .editor-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
      }
      
      .editor-content th, .editor-content td {
        border: 1px solid #d1d5db;
        padding: 0.5rem;
      }
      
      .editor-content th {
        background-color: #f3f4f6;
        font-weight: bold;
      }
      
      .editor-content pre {
        background-color: #f3f4f6;
        padding: 0.5rem;
        border-radius: 0.25rem;
        overflow-x: auto;
      }
      
      .editor-content code {
        font-family: monospace;
      }
      
      .editor-content hr {
        border: none;
        border-top: 1px solid #d1d5db;
        margin: 1rem 0;
      }
      
      .editor-content img {
        max-width: 100%;
        height: auto;
      }
      
      .editor-content .checkbox-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.25rem;
      }
      
      .editor-content .editor-checkbox {
        margin-right: 0.5rem;
        cursor: pointer;
      }
      
      .editor-content .conclusion-heading {
        color: #2563eb;
        border-bottom: 1px solid #bfdbfe;
        padding-bottom: 0.25rem;
      }
      
      .editor-content .conclusion-content {
        color: #1e40af;
      }
      
      .editor-content .implementation-heading {
        color: #0f766e;
        border-bottom: 1px solid #99f6e4;
        padding-bottom: 0.25rem;
      }
      
      .editor-content .restart-heading {
        color: #b91c1c;
        border-bottom: 1px solid #fecaca;
        padding-bottom: 0.25rem;
      }
      
      .editor-content [data-placeholder]:empty:before {
        content: attr(data-placeholder);
        color: #9ca3af;
        pointer-events: none;
      }
      
      /* Enhance numbered list with better visibility */
      .editor-content ol > li {
        counter-increment: item;
        position: relative;
      }
      
      .editor-content ol > li:before {
        content: counter(item) ".";
        display: inline-block;
        position: absolute;
        left: -1rem;
        width: 1rem;
        text-align: right;
      }
      
      /* Ensure proper styles for pasted content */
      .editor-content ol li, .editor-content ul li {
        margin-bottom: 0.1rem !important;
        line-height: 1.2 !important;
        font-size: 0.85rem !important;
      }
    `}</style>
  );
};

export default ContentStyles;
