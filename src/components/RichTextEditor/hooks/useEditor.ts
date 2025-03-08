import { RefObject, useEffect } from "react";

export const useEditor = (editorRef: RefObject<HTMLDivElement>) => {
  // Ensure the editor content is editable when loaded
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setAttribute('contenteditable', 'true');
      editorRef.current.focus();
      
      // Add paste event handler to preserve tables when pasting
      const handlePaste = (event: ClipboardEvent) => {
        // Don't interfere with non-HTML content
        if (!event.clipboardData?.types.includes('text/html')) {
          return;
        }
        
        const html = event.clipboardData.getData('text/html');
        
        // Check if content contains tables
        if (html.includes('<table') || html.includes('<tbody') || html.includes('<tr') || html.includes('<td')) {
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
          
          // Insert the processed HTML at the current selection
          document.execCommand('insertHTML', false, tempDiv.innerHTML);
          
          // Trigger an input event to ensure changes are registered
          if (editorRef.current) {
            const inputEvent = new Event('input', { bubbles: true });
            editorRef.current.dispatchEvent(inputEvent);
          }
        }
      };
      
      // Add the paste event listener
      editorRef.current.addEventListener('paste', handlePaste);
      
      // Clean up the event listener on unmount
      return () => {
        editorRef.current?.removeEventListener('paste', handlePaste);
      };
    }
  }, [editorRef]);

  const execCommand = (command: string, value: string = "") => {
    // Save the current selection
    const selection = window.getSelection();
    let range = null;
    
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }
    
    // Ensure focus is on the editor before executing command
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Restore selection if we had one
      if (range) {
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // Focus back on the editor after applying format
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Trigger input event to ensure content changes are detected
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  };

  const formatTableCells = (alignment: string) => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    // Find cells from selection
    let cells: Element[] = [];
    
    if (range.commonAncestorContainer instanceof Element) {
      // If the common ancestor is a table or contains tables
      if (range.commonAncestorContainer.tagName === 'TABLE' || 
          range.commonAncestorContainer.querySelector('table')) {
        cells = Array.from(range.commonAncestorContainer.querySelectorAll('td, th'));
      } else {
        // Check if we're inside a cell
        let parent: Node | Element | null = range.commonAncestorContainer;
        while (parent && parent !== editorRef.current) {
          if (parent instanceof Element && (parent.tagName === 'TD' || parent.tagName === 'TH')) {
            cells.push(parent);
            break;
          }
          parent = parent.parentElement;
          if (!parent) break;
        }
      }
    } else if (range.commonAncestorContainer.parentElement) {
      // Navigate up to find if we're in a table
      let parent = range.commonAncestorContainer.parentElement;
      while (parent && parent !== editorRef.current) {
        if (parent.tagName === 'TD' || parent.tagName === 'TH') {
          cells.push(parent);
          break;
        } else if (parent.tagName === 'TABLE') {
          cells = Array.from(parent.querySelectorAll('td, th'));
          break;
        }
        if (!parent.parentElement) break;
        parent = parent.parentElement;
      }
    }
    
    // Apply alignment to found cells
    if (cells.length > 0) {
      cells.forEach(cell => {
        (cell as HTMLElement).style.textAlign = alignment;
      });
    }

    // After formatting, trigger input event
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  };

  return {
    execCommand,
    formatTableCells
  };
};
