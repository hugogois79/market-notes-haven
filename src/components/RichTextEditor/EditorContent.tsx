
import { useEffect, RefObject, useCallback } from "react";

interface EditorContentProps {
  editorRef: RefObject<HTMLDivElement>;
  handleContentChange: () => void;
  initialContent: string;
  onAutoSave?: () => void; // New prop for auto-save functionality
  autoSaveDelay?: number; // Delay in milliseconds before triggering auto-save
}

const EditorContent = ({ 
  editorRef, 
  handleContentChange, 
  initialContent,
  onAutoSave,
  autoSaveDelay = 3000 // Default to 3 seconds
}: EditorContentProps) => {
  // Set initial content when the component mounts
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent || '';
      
      // Keep focus in the editor after applying formatting
      const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const isInEditor = editorRef.current?.contains(range.commonAncestorContainer);
          if (isInEditor) {
            editorRef.current?.focus();
          }
        }
      };
      
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }
  }, [editorRef, initialContent]);

  // Create a debounced auto-save function
  const debouncedAutoSave = useCallback(() => {
    if (onAutoSave) {
      const timer = setTimeout(() => {
        onAutoSave();
      }, autoSaveDelay);
      
      return () => clearTimeout(timer);
    }
  }, [onAutoSave, autoSaveDelay]);

  // Setup auto-save on content changes
  const handleInput = () => {
    handleContentChange();
    debouncedAutoSave();
  };

  return (
    <div 
      className="p-4 min-h-[300px] focus:outline-none overflow-auto"
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onBlur={handleContentChange}
      style={{ 
        lineHeight: '1.5',
        // Add these styles to better handle tables
        overflowX: 'auto',
        whiteSpace: 'normal'
      }}
      data-placeholder="Start writing..."
    />
  );
};

export default EditorContent;
