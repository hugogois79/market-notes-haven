
import { useCallback, RefObject } from "react";

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
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      
      // Notify parent component about content change
      if (onContentUpdate && editorRef.current) {
        onContentUpdate(editorRef.current.innerHTML);
        
        // Apply styling to conclusion headings and sections
        if (editorRef.current) {
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
        }
      }
      
      debouncedAutoSave(); // This will only trigger autosave if it's enabled
    }
  }, [onChange, onContentUpdate, debouncedAutoSave, editorRef]);

  return { handleContentChange };
};
