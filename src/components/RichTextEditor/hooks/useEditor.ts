
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
    
    // For list and heading formatting, ensure consistent styles
    if (command === "formatBlock") {
      if (value === "<h1>") {
        // Apply H1 styling
        document.execCommand(command, false, value);
        
        // Get the current selection and find the heading element
        if (selection && selection.rangeCount > 0) {
          const container = selection.getRangeAt(0).commonAncestorContainer;
          let h1Element = container.nodeType === 1 
            ? (container as Element).closest('h1') 
            : (container.parentElement?.closest('h1'));
          
          if (h1Element && h1Element instanceof HTMLElement) {
            h1Element.style.fontSize = '1.5rem';
            h1Element.style.fontWeight = '600';
            h1Element.style.marginTop = '1rem';
            h1Element.style.marginBottom = '0.5rem';
          }
        }
      } else if (value === "<h2>") {
        // Apply H2 styling
        document.execCommand(command, false, value);
        
        // Get the current selection and find the heading element
        if (selection && selection.rangeCount > 0) {
          const container = selection.getRangeAt(0).commonAncestorContainer;
          let h2Element = container.nodeType === 1 
            ? (container as Element).closest('h2') 
            : (container.parentElement?.closest('h2'));
          
          if (h2Element && h2Element instanceof HTMLElement) {
            h2Element.style.fontSize = '1.25rem';
            h2Element.style.fontWeight = '500';
            h2Element.style.marginTop = '0.75rem';
            h2Element.style.marginBottom = '0.5rem';
          }
        }
      } else if (value === "<p>") {
        // Apply paragraph styling
        document.execCommand(command, false, value);
        
        // Get the current selection and find the paragraph element
        if (selection && selection.rangeCount > 0) {
          const container = selection.getRangeAt(0).commonAncestorContainer;
          let pElement = container.nodeType === 1 
            ? (container as Element).closest('p') 
            : (container.parentElement?.closest('p'));
          
          if (pElement && pElement instanceof HTMLElement) {
            pElement.style.fontSize = '0.875rem';
            pElement.style.marginBottom = '0.5rem';
          }
        }
      } else {
        // For other formatBlock commands
        document.execCommand(command, false, value);
      }
    } else if (command === "insertUnorderedList" || command === "insertOrderedList") {
      // Apply list formatting
      document.execCommand(command, false, value);
      
      // Apply additional styling to the created list
      if (selection && selection.rangeCount > 0) {
        const container = selection.getRangeAt(0).commonAncestorContainer;
        const listElement = container.nodeType === 1 
          ? (container as Element).closest('ul, ol') 
          : (container.parentElement?.closest('ul, ol'));
        
        if (listElement && listElement instanceof HTMLElement) {
          if (listElement.tagName === 'UL') {
            listElement.style.listStyleType = 'disc';
          } else if (listElement.tagName === 'OL') {
            listElement.style.listStyleType = 'decimal';
          }
          listElement.style.paddingLeft = '2rem';
          listElement.style.margin = '0.5rem 0';
          
          // Style list items
          const items = listElement.querySelectorAll('li');
          items.forEach(item => {
            (item as HTMLElement).style.marginBottom = '0.25rem';
          });
        }
      }
    } else {
      // Execute regular commands
      document.execCommand(command, false, value);
    }
    
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
    const container = range.commonAncestorContainer;
    
    // First, try to align table cells if we're in a table
    let cells: Element[] = [];
    let inTable = false;
    
    // Check if we're in a table by looking for table-related elements
    if (container instanceof Element) {
      // If the common ancestor is a table or contains tables
      if (container.tagName === 'TABLE' || 
          container.querySelector('table')) {
        cells = Array.from(container.querySelectorAll('td, th'));
        inTable = true;
      } else {
        // Check if we're inside a cell
        let parent: Node | Element | null = container;
        while (parent && parent !== editorRef.current) {
          if (parent instanceof Element && (parent.tagName === 'TD' || parent.tagName === 'TH')) {
            cells.push(parent);
            inTable = true;
            break;
          }
          parent = parent.parentElement;
          if (!parent) break;
        }
      }
    } else if (container.parentElement) {
      // Navigate up to find if we're in a table
      let parent = container.parentElement;
      while (parent && parent !== editorRef.current) {
        if (parent.tagName === 'TD' || parent.tagName === 'TH') {
          cells.push(parent);
          inTable = true;
          break;
        } else if (parent.tagName === 'TABLE') {
          cells = Array.from(parent.querySelectorAll('td, th'));
          inTable = true;
          break;
        }
        if (!parent.parentElement) break;
        parent = parent.parentElement;
      }
    }
    
    // Check if we're in a list element
    let inList = false;
    let listElement: Element | null = null;
    
    if (container instanceof Element) {
      listElement = container.closest('ul, ol, li');
      if (listElement) inList = true;
    } else if (container.parentElement) {
      listElement = container.parentElement.closest('ul, ol, li');
      if (listElement) inList = true;
    }

    // Apply alignment to found table cells
    if (cells.length > 0 && inTable) {
      cells.forEach(cell => {
        (cell as HTMLElement).style.textAlign = alignment;
      });
    } else if (inList && listElement) {
      // Apply alignment to list element
      (listElement as HTMLElement).style.textAlign = alignment;
    } else {
      // If we're not in a table or list, apply alignment to the current block
      // Reset alignment first for consistency
      document.execCommand('justifyLeft', false, '');
      
      switch(alignment) {
        case 'center':
          document.execCommand('justifyCenter', false, '');
          break;
        case 'right':
          document.execCommand('justifyRight', false, '');
          break;
        case 'justify':
          document.execCommand('justifyFull', false, '');
          break;
        case 'left':
        default:
          document.execCommand('justifyLeft', false, '');
          break;
      }
    }

    // After formatting, trigger input event
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  };
  
  const insertVerticalSeparator = () => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    // Create a horizontal separator with just a line (no section symbol)
    const separatorHTML = `
      <div class="chapter-separator" style="
        width: 100%;
        margin: 1.5rem 0;
        text-align: center;
        position: relative;
        overflow: hidden;
        height: 20px;
      ">
        <hr style="
          margin: 0;
          border: none;
          border-top: 1px solid #d1d5db;
        "/>
      </div>
    `;
    
    // Insert the separator HTML
    document.execCommand('insertHTML', false, separatorHTML);
    
    // Trigger an input event to ensure changes are registered
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  };

  return {
    execCommand,
    formatTableCells,
    insertVerticalSeparator
  };
};
