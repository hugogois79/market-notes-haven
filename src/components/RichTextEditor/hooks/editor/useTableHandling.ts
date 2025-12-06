
import { RefObject, useCallback, useEffect } from "react";

export const useTableHandling = (editorRef: RefObject<HTMLDivElement>) => {
  const handlePaste = useCallback((event: ClipboardEvent) => {
    // Get clipboard data
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    // Check if content contains HTML
    if (!clipboardData.types.includes('text/html')) {
      // Let plain text paste happen normally
      return;
    }
    
    const html = clipboardData.getData('text/html');
    const plainText = clipboardData.getData('text/plain');
    
    // Only process if content contains tables or lists that need special handling
    if (html.includes('<table') || html.includes('<tbody') || html.includes('<tr') || html.includes('<td') ||
        html.includes('<ul') || html.includes('<ol') || html.includes('<li')) {
      event.preventDefault();
      
      // Create a temporary div to sanitize the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Process tables to ensure they have appropriate styling
      const tables = tempDiv.querySelectorAll('table');
      tables.forEach(table => {
        table.setAttribute('style', 'border-collapse: collapse; width: auto; margin: 1rem 0;');
        
        const cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
          if (cell.tagName === 'TH') {
            cell.setAttribute('style', 'border: 1px solid #d1d5db; padding: 0.5rem 1rem; background-color: #f3f4f6; font-weight: bold; text-align: left;');
          } else {
            cell.setAttribute('style', 'border: 1px solid #d1d5db; padding: 0.5rem 1rem; text-align: left;');
          }
        });
      });
      
      // Process lists
      const lists = tempDiv.querySelectorAll('ul, ol');
      lists.forEach(list => {
        if (list.tagName === 'UL') {
          list.setAttribute('style', 'list-style-type: disc; padding-left: 2rem; margin: 0.5rem 0;');
        } else if (list.tagName === 'OL') {
          list.setAttribute('style', 'list-style-type: decimal; padding-left: 2rem; margin: 0.5rem 0;');
        }
        
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          item.setAttribute('style', 'margin-bottom: 0.25rem;');
        });
      });
      
      // Insert using modern Selection API
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a document fragment from the processed HTML
        const fragment = document.createRange().createContextualFragment(tempDiv.innerHTML);
        range.insertNode(fragment);
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Trigger input event
      if (editorRef.current) {
        const inputEvent = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(inputEvent);
      }
    }
    // For non-table/list HTML, let the browser handle it normally
  }, [editorRef]);

  // Attach paste listener
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('paste', handlePaste);
      return () => {
        editor.removeEventListener('paste', handlePaste);
      };
    }
  }, [editorRef, handlePaste]);

  return { handlePaste };
};
