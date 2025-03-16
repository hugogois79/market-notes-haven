
import { RefObject, useCallback } from "react";

export const useTableHandling = (editorRef: RefObject<HTMLDivElement>) => {
  const handlePaste = useCallback((event: ClipboardEvent) => {
    // Don't interfere with non-HTML content
    if (!event.clipboardData?.types.includes('text/html')) {
      return;
    }
    
    const html = event.clipboardData.getData('text/html');
    
    // Check if content contains tables or lists
    if (html.includes('<table') || html.includes('<tbody') || html.includes('<tr') || html.includes('<td') ||
        html.includes('<ul') || html.includes('<ol') || html.includes('<li')) {
      event.preventDefault();
      
      // Create a temporary div to sanitize the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Process tables to ensure they have appropriate styling
      const tables = tempDiv.querySelectorAll('table');
      if (tables.length > 0) {
        tables.forEach(table => {
          // Add default styling to ensure tables display correctly
          table.setAttribute('style', 'border-collapse: collapse; width: auto; margin: 1rem 0;');
          
          // Add borders and padding to cells if they don't have any
          const cells = table.querySelectorAll('td, th');
          cells.forEach(cell => {
            // Use setAttribute for consistent styling
            cell.setAttribute('style', 'border: 1px solid #d1d5db; padding: 0.5rem 1rem; text-align: left;');
            
            // Add background color to headers if they don't have any
            if (cell.tagName === 'TH') {
              cell.setAttribute('style', 'border: 1px solid #d1d5db; padding: 0.5rem 1rem; background-color: #f3f4f6; font-weight: bold; text-align: left;');
            }
          });
        });
      }
      
      // Process lists to ensure they have appropriate styling
      const lists = tempDiv.querySelectorAll('ul, ol');
      if (lists.length > 0) {
        lists.forEach(list => {
          // Apply correct list styling
          if (list.tagName === 'UL') {
            list.setAttribute('style', 'list-style-type: disc; padding-left: 2rem; margin: 0.5rem 0;');
          } else if (list.tagName === 'OL') {
            list.setAttribute('style', 'list-style-type: decimal; padding-left: 2rem; margin: 0.5rem 0;');
          }
          
          // Style list items
          const items = list.querySelectorAll('li');
          items.forEach(item => {
            item.setAttribute('style', 'margin-bottom: 0.25rem;');
          });
        });
      }
      
      // Insert the processed HTML at the current selection
      document.execCommand('insertHTML', false, tempDiv.innerHTML);
      
      // Trigger an input event to ensure changes are registered
      if (editorRef.current) {
        const inputEvent = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(inputEvent);
      }
    }
  }, [editorRef]);

  return { handlePaste };
};
