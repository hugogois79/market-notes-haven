
import { RefObject, useEffect } from "react";
import { useTableHandling } from './useTableHandling';
import { useTextFormatting } from './useTextFormatting';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

export const useEditor = (editorRef: RefObject<HTMLDivElement>, hasConclusion = true) => {
  // Make editor content editable when loaded
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setAttribute('contenteditable', 'true');
      editorRef.current.focus();
    }
  }, [editorRef]);

  // Apply styling for lack of conclusion if needed
  useEffect(() => {
    if (editorRef.current && hasConclusion === false) {
      // Style will be applied in the EditorContent component
      console.log("useEditor: No conclusion detected");
    }
  }, [editorRef, hasConclusion]);

  // Compose all the specialized hooks
  const { handlePaste } = useTableHandling(editorRef);
  const { 
    execCommand, 
    formatTableCells, 
    insertVerticalSeparator, 
    highlightText,
    boldText
  } = useTextFormatting(editorRef);

  // Setup paste event handler
  useEffect(() => {
    if (editorRef.current) {
      // Add the paste event listener
      editorRef.current.addEventListener('paste', handlePaste);
      
      // Clean up the event listener on unmount
      return () => {
        editorRef.current?.removeEventListener('paste', handlePaste);
      };
    }
  }, [editorRef, handlePaste]);

  // Add keyboard shortcuts
  useKeyboardShortcuts(editorRef, execCommand, formatTableCells);

  return {
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText
  };
};
