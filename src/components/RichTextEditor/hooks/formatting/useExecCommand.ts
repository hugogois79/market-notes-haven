
import { RefObject, useCallback } from "react";

/**
 * Hook for handling basic document.execCommand operations
 */
export const useExecCommand = (editorRef: RefObject<HTMLDivElement>) => {
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
  
  return execCommand;
};
