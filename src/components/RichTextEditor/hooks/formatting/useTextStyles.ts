
import { RefObject, useCallback } from "react";
import { useExecCommand } from "./useExecCommand";

/**
 * Hook for text styling operations like bold, italic, underline, highlight
 */
export const useTextStyles = (editorRef: RefObject<HTMLDivElement>) => {
  const execCommand = useExecCommand(editorRef);
  
  const boldText = useCallback(() => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    // Execute the bold command - no third parameter needed for toggle behavior
    document.execCommand('bold', false);
    
    // Trigger an input event to ensure changes are registered
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  }, [editorRef]);

  const underlineText = useCallback(() => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    // Apply underline formatting
    document.execCommand('underline', false);
    
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
    
    // Apply background color directly using execCommand for better toggling support
    document.execCommand('backColor', false, '#FEF7CD');
    
    // Trigger an input event to ensure changes are registered
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  }, [editorRef]);
  
  const yellowUnderlineText = useCallback(() => {
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
    
    // Create a span with yellow underline
    const span = document.createElement('span');
    span.style.borderBottom = '2px solid #F97316'; // Bright orange underline
    span.style.paddingBottom = '2px';
    
    // Extract the selected content
    const fragment = range.extractContents();
    span.appendChild(fragment);
    
    // Insert the newly styled span
    range.insertNode(span);
    
    // Collapse the selection after our inserted span
    selection.collapseToEnd();
    
    // Trigger an input event to ensure changes are registered
    if (editorRef.current) {
      const inputEvent = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(inputEvent);
    }
  }, [editorRef]);
  
  return {
    boldText,
    underlineText,
    highlightText,
    yellowUnderlineText
  };
};
