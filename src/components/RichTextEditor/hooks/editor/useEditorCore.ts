
import { RefObject, useEffect } from "react";
import { useTableHandling } from './useTableHandling';
import { useTextFormatting } from '../formatting';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { formatCheckboxText, processExistingListsFormatting } from '../formatting/formatters';

export const useEditor = (editorRef: RefObject<HTMLDivElement>, hasConclusion = true) => {
  // Make editor content editable when loaded and ensure it remains that way
  useEffect(() => {
    if (editorRef.current) {
      // Apply multiple techniques to ensure editability
      editorRef.current.contentEditable = 'true';
      editorRef.current.setAttribute('contenteditable', 'true');
      
      // Set appropriate styling
      editorRef.current.style.userSelect = 'text';
      editorRef.current.style.webkitUserSelect = 'text';
      editorRef.current.style.cursor = 'text';
      editorRef.current.style.minHeight = '200px';
      editorRef.current.style.whiteSpace = 'pre-wrap'; // Use pre-wrap to preserve formatting
      
      // Make sure the editor can be interacted with
      editorRef.current.tabIndex = 0;
      
      // Remove any problematic attributes
      editorRef.current.removeAttribute('readonly');
      editorRef.current.removeAttribute('disabled');
      
      // Process any existing checkboxes
      processCheckboxes();
      
      // Process existing lists to ensure proper bullet points and numbering
      processExistingListsFormatting(editorRef);
      
      // Force focus on the editor after initialization
      setTimeout(() => {
        if (editorRef.current) {
          // Apply all necessary attributes again just before focusing
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
          editorRef.current.focus();
          
          // Try to place cursor at beginning for empty editors
          const content = editorRef.current.innerHTML;
          if (!content || content.trim() === '') {
            const selection = window.getSelection();
            const range = document.createRange();
            
            // Ensure proper cursor placement
            if (selection) {
              try {
                // Create a text node if there isn't content
                if (!editorRef.current.firstChild) {
                  const textNode = document.createTextNode('\u200B'); // Zero-width space for better cursor visibility
                  editorRef.current.appendChild(textNode);
                  range.setStart(textNode, 0);
                } else {
                  range.setStart(editorRef.current.firstChild, 0);
                }
                
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              } catch (error) {
                console.error("Error positioning cursor:", error);
              }
            }
          }
        }
      }, 10); // Much shorter delay for faster focusing
    }
    
    // Set up an observer to maintain bullet points when content changes
    const observerOptions = { childList: true, subtree: true, characterData: true };
    const observer = new MutationObserver(() => {
      // Process existing lists to maintain bullet points and numbering
      processExistingListsFormatting(editorRef);
    });
    
    if (editorRef.current) {
      observer.observe(editorRef.current, observerOptions);
    }
    
    // Continuously check and fix editability - check extremely frequently
    const editableCheckInterval = setInterval(() => {
      if (editorRef.current) {
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
        }
        
        // Periodically check for lists that need bullet points or numbering
        processExistingListsFormatting(editorRef);
      }
    }, 500); // Check occasionally for list formatting
    
    return () => {
      clearInterval(editableCheckInterval);
      observer.disconnect();
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

  // Compose all the specialized hooks
  const { handlePaste } = useTableHandling(editorRef);
  const { 
    execCommand, 
    formatTableCells, 
    insertVerticalSeparator, 
    highlightText,
    boldText,
    underlineText,
    yellowUnderlineText
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
  useKeyboardShortcuts(editorRef, execCommand, formatTableCells, yellowUnderlineText);

  return {
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText,
    underlineText,
    yellowUnderlineText,
    processCheckboxes
  };
};
