
import { RefObject, useCallback } from "react";
import { useExecCommand } from "./useExecCommand";
import { useTextStyles } from "./useTextStyles";
import { useAlignmentFormatting } from "./useAlignmentFormatting";
import { useElementInsert } from "./useElementInsert";
import { applyHeadingFormatting, applyListFormatting } from './formatters';

/**
 * Main hook that combines all formatting functionality
 */
export const useTextFormatting = (editorRef: RefObject<HTMLDivElement>) => {
  const execCommandBase = useExecCommand(editorRef);
  const { boldText, underlineText, highlightText } = useTextStyles(editorRef);
  const { formatTableCells } = useAlignmentFormatting(editorRef);
  const { insertVerticalSeparator } = useElementInsert(editorRef);
  
  // Enhanced execCommand that handles special cases
  const execCommand = useCallback((command: string, value: string = "") => {
    // For heading 3 specifically, make sure we execute the command directly
    if (command === "formatBlock" && value === "<h3>") {
      document.execCommand(command, false, value);
      
      // Apply custom styling for H3 elements
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const container = selection.getRangeAt(0).commonAncestorContainer;
        const h3Element = container.nodeType === 1 
          ? (container as Element).closest('h3') 
          : (container.parentElement?.closest('h3'));
        
        if (h3Element && h3Element instanceof HTMLElement) {
          h3Element.style.fontSize = '0.9rem'; // Smaller size for H3
          h3Element.style.fontWeight = '500';
        }
      }
    } 
    // For list and heading formatting, ensure consistent styles
    else if (command === "formatBlock") {
      applyHeadingFormatting(command, value);
    } else if (command === "insertUnorderedList" || command === "insertOrderedList") {
      applyListFormatting(command, value);
    } else {
      // Execute regular commands
      execCommandBase(command, value);
    }
  }, [execCommandBase]);
  
  return {
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText,
    underlineText
  };
};

// Re-export the individual hooks for direct access
export { useExecCommand } from "./useExecCommand";
export { useTextStyles } from "./useTextStyles";
export { useAlignmentFormatting } from "./useAlignmentFormatting";
export { useElementInsert } from "./useElementInsert";
export * from "./formatters";
