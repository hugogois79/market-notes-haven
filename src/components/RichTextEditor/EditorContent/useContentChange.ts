
import { useCallback, RefObject } from "react";
import { processExistingListsFormatting } from '../hooks/formatting/formatters';

interface UseContentChangeProps {
  onChange: (content: string) => void;
  onContentUpdate?: (content: string) => void;
  onAutoSave?: () => void;
  autoSaveDelay?: number;
  editorRef: RefObject<HTMLDivElement>;
}

/**
 * Custom hook to handle content changes in the editor
 */
export const useContentChange = ({
  onChange,
  onContentUpdate,
  onAutoSave,
  autoSaveDelay = 3000,
  editorRef
}: UseContentChangeProps) => {
  // Create a debounced auto-save function (will only run if autoSave is enabled)
  const debouncedAutoSave = useCallback(() => {
    if (onAutoSave) {
      const timer = setTimeout(() => {
        onAutoSave();
      }, autoSaveDelay);
      
      return () => clearTimeout(timer);
    }
  }, [onAutoSave, autoSaveDelay]);

  // Handle content change event
  const handleContentChange = useCallback((event?: React.FormEvent) => {
    // Don't prevent default - allow normal input/paste behavior
  
    if (editorRef.current) {
      // Re-establish editability every time content changes
      editorRef.current.contentEditable = 'true';
      editorRef.current.setAttribute('contenteditable', 'true');
      
      // Process checkboxes in the content
      processCheckboxes();
      
      // Ensure lists have proper formatting
      processExistingListsFormatting(editorRef);
      
      // Get the updated content and notify parent
      onChange(editorRef.current.innerHTML);
      
      // Notify parent component about content change
      if (onContentUpdate && editorRef.current) {
        onContentUpdate(editorRef.current.innerHTML);
        
        // Apply styling to conclusion headings and sections
        if (editorRef.current) {
          // Process any lists to ensure they have bullet points and proper numbering
          const lists = editorRef.current.querySelectorAll('ul, ol');
          lists.forEach(list => {
            if (list instanceof HTMLElement) {
              if (list.tagName === 'UL') {
                list.style.listStyleType = 'disc';
                list.style.paddingLeft = '2rem';
              } else if (list.tagName === 'OL') {
                list.style.listStyleType = 'decimal';
                list.style.paddingLeft = '2rem';
                list.style.counterReset = 'item';
                
                // Ensure each item has correct counter
                const items = list.querySelectorAll('li');
                items.forEach((item, index) => {
                  if (item instanceof HTMLElement) {
                    item.style.counterIncrement = 'item';
                    item.setAttribute('data-index', String(index + 1));
                  }
                });
              }
              list.style.margin = '0.5rem 0';
            }
          });
          
          // Rest of conclusion formatting
          const conclusionHeadings = editorRef.current.querySelectorAll('h1, h2, h3');
          conclusionHeadings.forEach(heading => {
            if (heading.textContent?.trim().toLowerCase() === 'conclusion') {
              heading.classList.add('conclusion-heading');
              
              // Apply styles to the content after the heading until the next heading
              let currentElement = heading.nextElementSibling;
              while (currentElement && 
                    !['H1', 'H2', 'H3'].includes(currentElement.tagName)) {
                currentElement.classList.add('conclusion-content');
                currentElement = currentElement.nextElementSibling;
              }
            }
          });
          
          // Apply styling to Implementation Checklist section
          const implementationHeadings = editorRef.current.querySelectorAll('h1, h2, h3');
          implementationHeadings.forEach(heading => {
            if (heading.textContent?.trim().toLowerCase().includes('implementation checklist')) {
              heading.classList.add('implementation-heading');
            }
          });
          
          // Apply styling to Restart Conditions section
          const restartHeadings = editorRef.current.querySelectorAll('h1, h2, h3');
          restartHeadings.forEach(heading => {
            if (heading.textContent?.trim().toLowerCase().includes('restart conditions')) {
              heading.classList.add('restart-heading');
            }
          });
        }
      }
      
      debouncedAutoSave(); // This will only trigger autosave if it's enabled
    }
  }, [onChange, onContentUpdate, debouncedAutoSave, editorRef]);
  
  // Process checkboxes in the content
  const processCheckboxes = useCallback(() => {
    if (!editorRef.current) return;
    
    // Find all possible checkbox patterns and replace them
    const allParagraphs = editorRef.current.querySelectorAll('p');
    allParagraphs.forEach(paragraph => {
      const text = paragraph.textContent || '';
      
      // Skip paragraphs that already have a checkbox
      if (paragraph.querySelector('input[type="checkbox"]')) {
        return;
      }
      
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
        
        // Add change handler for the checkbox
        checkboxInput.addEventListener('change', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
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
  }, [editorRef]);

  return { handleContentChange, processCheckboxes };
};
