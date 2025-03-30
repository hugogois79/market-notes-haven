
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
      
      // Process any existing checkboxes
      processCheckboxes();
    }
  }, [editorRef]);

  // Process checkboxes in the content
  const processCheckboxes = () => {
    if (!editorRef.current) return;
    
    // Find all possible checkbox patterns and replace them
    const allParagraphs = editorRef.current.querySelectorAll('p');
    allParagraphs.forEach(paragraph => {
      const text = paragraph.textContent || '';
      
      // Check if the paragraph starts with '[ ]' or '[x]' or '[]'
      if (text.trim().startsWith('[ ]') || text.trim().startsWith('[x]') || text.trim().startsWith('[]')) {
        // Create a checkbox element
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.className = 'editor-checkbox';
        
        // Set checkbox state based on content
        checkboxInput.checked = text.trim().startsWith('[x]');
        
        // Make it editable within the contenteditable area
        checkboxInput.contentEditable = 'false';
        
        // Replace the text marker with the actual checkbox
        const label = document.createElement('span');
        label.className = 'checkbox-label';
        label.textContent = text.replace(/^\s*\[\s*x?\s*\]\s*/, '');
        
        // Clear paragraph and add new elements
        paragraph.innerHTML = '';
        paragraph.appendChild(checkboxInput);
        paragraph.appendChild(label);
        paragraph.className = 'checkbox-item';
      }
    });
  };

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
    boldText,
    processCheckboxes
  };
};
