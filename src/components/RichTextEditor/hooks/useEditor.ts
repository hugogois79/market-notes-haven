
import { RefObject } from "react";

export const useEditor = (editorRef: RefObject<HTMLDivElement>) => {
  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      // Focus back on the editor after applying format
      editorRef.current.focus();
    }
  };

  const formatTableCells = (alignment: string) => {
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
