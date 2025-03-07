
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
    }
  };

  const formatTableCells = (alignment: string) => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    // Fix: Check if commonAncestorContainer is an Element before calling querySelectorAll
    let cells: Element[] = [];
    
    if (range.commonAncestorContainer instanceof Element) {
      cells = Array.from(range.commonAncestorContainer.querySelectorAll('td, th'));
    } else if (range.commonAncestorContainer.parentElement) {
      cells = Array.from(range.commonAncestorContainer.parentElement.querySelectorAll('td, th'));
    }
    
    if (cells.length === 0) {
      // Try to find if cursor is inside a td/th
      let node: Node | null = range.startContainer;
      while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH' && node !== document.body) {
        node = node.parentNode;
      }
      
      if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
        cells.push(node as Element);
      }
    }
    
    if (cells.length > 0) {
      cells.forEach(cell => {
        (cell as HTMLElement).style.textAlign = alignment;
      });
    }
  };

  return {
    execCommand,
    formatTableCells
  };
};
