
import { RefObject, useCallback } from "react";

/**
 * Hook for handling text alignment operations
 */
export const useAlignmentFormatting = (editorRef: RefObject<HTMLDivElement>) => {
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
        // Use textAlign CSS style
        (cell as HTMLElement).style.textAlign = alignment;
        
        // Also add a CSS class for better print compatibility
        if (alignment === 'justify') {
          cell.classList.add('text-justify');
          cell.classList.remove('text-left', 'text-center', 'text-right');
        } else if (alignment === 'center') {
          cell.classList.add('text-center');
          cell.classList.remove('text-left', 'text-justify', 'text-right');
        } else if (alignment === 'right') {
          cell.classList.add('text-right');
          cell.classList.remove('text-left', 'text-center', 'text-justify');
        } else {
          cell.classList.add('text-left');
          cell.classList.remove('text-center', 'text-justify', 'text-right');
        }
      });
    } else if (inList && listElement) {
      // Apply alignment to list element
      (listElement as HTMLElement).style.textAlign = alignment;
      
      // Also add a CSS class for better print compatibility
      if (alignment === 'justify') {
        listElement.classList.add('text-justify');
        listElement.classList.remove('text-left', 'text-center', 'text-right');
      } else if (alignment === 'center') {
        listElement.classList.add('text-center');
        listElement.classList.remove('text-left', 'text-justify', 'text-right');
      } else if (alignment === 'right') {
        listElement.classList.add('text-right');
        listElement.classList.remove('text-left', 'text-center', 'text-justify');
      } else {
        listElement.classList.add('text-left');
        listElement.classList.remove('text-center', 'text-justify', 'text-right');
      }
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
      
      // Apply the appropriate CSS class to the parent element for better print support
      const currentParent = range.commonAncestorContainer instanceof Text 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer as HTMLElement;
      
      if (currentParent) {
        if (alignment === 'justify') {
          currentParent.classList.add('text-justify');
          currentParent.classList.remove('text-left', 'text-center', 'text-right');
        } else if (alignment === 'center') {
          currentParent.classList.add('text-center');
          currentParent.classList.remove('text-left', 'text-justify', 'text-right');
        } else if (alignment === 'right') {
          currentParent.classList.add('text-right');
          currentParent.classList.remove('text-left', 'text-center', 'text-justify');
        } else {
          currentParent.classList.add('text-left');
          currentParent.classList.remove('text-center', 'text-justify', 'text-right');
        }
      }
    }

    // After formatting, trigger input event
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  }, [editorRef]);
  
  return { formatTableCells };
};
