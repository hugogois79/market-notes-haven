
import { RefObject, useEffect } from "react";

export const useEditor = (editorRef: RefObject<HTMLDivElement>) => {
  // Ensure the editor content is editable when loaded
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setAttribute('contenteditable', 'true');
      editorRef.current.focus();
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
      
      // Trigger input event to ensure content changes are detected for auto-save
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
        let parent: Node | Element = range.commonAncestorContainer;
        while (parent && parent !== editorRef.current) {
          if (parent instanceof Element && (parent.tagName === 'TD' || parent.tagName === 'TH')) {
            cells.push(parent);
            break;
          }
          const parentElement = parent.parentElement;
          if (!parentElement) break;
          parent = parentElement;
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

    // After formatting, trigger input event for auto-save
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
