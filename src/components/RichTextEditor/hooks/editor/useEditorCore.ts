
import { RefObject, useEffect } from "react";
import { useTableHandling } from './useTableHandling';
import { useTextFormatting } from './useTextFormatting';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { formatCheckboxText } from './textFormatters';

export const useEditor = (editorRef: RefObject<HTMLDivElement>, hasConclusion = true) => {
  // Make editor content editable when loaded and ensure it remains that way
  useEffect(() => {
    if (editorRef.current) {
      // Ensure it's editable using multiple approaches
      editorRef.current.setAttribute('contenteditable', 'true');
      editorRef.current.contentEditable = 'true';
      
      // Set focus
      editorRef.current.focus();
      
      // Process any existing checkboxes
      processCheckboxes();
      
      // Ensure the element isn't disabled or read-only somehow
      editorRef.current.style.userSelect = 'text';
      editorRef.current.style.webkitUserSelect = 'text';
      editorRef.current.style.cursor = 'text';
      editorRef.current.style.pointerEvents = 'auto';
      
      // Make sure the editor can be interacted with
      editorRef.current.tabIndex = 0;
      
      // Remove any problematic attributes
      editorRef.current.removeAttribute('readonly');
      editorRef.current.removeAttribute('disabled');
      
      console.log("Editor initialized and set to contentEditable");
    }
    
    // Add a more frequent check to ensure editability
    const editableCheckInterval = setInterval(() => {
      if (editorRef.current) {
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
          console.log("Restored contentEditable state on editor");
        }
      }
    }, 100); // Check very frequently
    
    return () => {
      clearInterval(editableCheckInterval);
    };
  }, [editorRef]);

  // Add a simpler click event handler
  useEffect(() => {
    const handleClick = () => {
      if (editorRef.current) {
        editorRef.current.contentEditable = 'true';
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
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
        // Skip if already processed (has checkbox element)
        if (paragraph.querySelector('input[type="checkbox"]')) {
          return;
        }

        // Create a checkbox element
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.className = 'editor-checkbox';
        
        // Set checkbox state based on content
        checkboxInput.checked = text.trim().startsWith('[x]');
        
        // Make it editable within the contenteditable area
        checkboxInput.contentEditable = 'false';
        
        // Add change event listener to handle checkbox state changes
        checkboxInput.addEventListener('change', () => {
          // Trigger input event to register content change
          const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true,
          });
          editorRef.current?.dispatchEvent(inputEvent);
        });
        
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
    boldText,
    underlineText
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
    underlineText,
    processCheckboxes
  };
};
