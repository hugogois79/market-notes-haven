
import { RefObject, useCallback } from "react";
import { applyHeadingFormatting, applyListFormatting } from './textFormatters';

export const useTextFormatting = (editorRef: RefObject<HTMLDivElement>) => {
  const execCommand = useCallback((command: string, value: string = "") => {
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
      applyHeadingFormatting(command, value, selection);
    } else if (command === "insertUnorderedList" || command === "insertOrderedList") {
      applyListFormatting(command, value, selection);
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
  }, [editorRef]);

  const formatTableCells = useCallback((alignment: string) => {
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
  }, [editorRef]);

  const insertVerticalSeparator = useCallback(() => {
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
  }, [editorRef]);

  const highlightText = useCallback(() => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Check if there's actual text selected
    if (range.collapsed) {
      // No text selected, do nothing
      return;
    }
    
    // Create a span with yellow background highlight
    const highlightedSpan = document.createElement('span');
    highlightedSpan.style.borderBottom = '2px solid #FEF7CD';
    highlightedSpan.style.backgroundColor = '#FEF7CD';
    
    try {
      // Try to apply the highlight span to the selected text
      range.surroundContents(highlightedSpan);
      
      // Trigger an input event to ensure changes are registered
      if (editorRef.current) {
        const inputEvent = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(inputEvent);
      }
    } catch (e) {
      // Handle the case when selection crosses node boundaries
      console.error("Could not highlight across node boundaries", e);
      
      // Alternative approach: Use execCommand to insert HTML
      const selectedText = range.toString();
      const highlightedHTML = `<span style="border-bottom: 2px solid #FEF7CD; background-color: #FEF7CD;">${selectedText}</span>`;
      
      document.execCommand('insertHTML', false, highlightedHTML);
    }
  }, [editorRef]);

  const boldText = useCallback(() => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    // Execute the bold command
    document.execCommand('bold', false, '');
    
    // Trigger an input event to ensure changes are registered
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  }, [editorRef]);

  return {
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText
  };
}, []);
