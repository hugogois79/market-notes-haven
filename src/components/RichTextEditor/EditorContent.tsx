
import { useEffect, RefObject, useCallback } from "react";

interface EditorContentProps {
  editorRef: RefObject<HTMLDivElement>;
  handleContentChange: () => void;
  initialContent: string;
  onAutoSave?: () => void; // Auto-save functionality still available but optional
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

  // Create a debounced auto-save function (will only run if autoSave is enabled)
  const debouncedAutoSave = useCallback(() => {
    if (onAutoSave) {
      const timer = setTimeout(() => {
        onAutoSave();
      }, autoSaveDelay);
      
      return () => clearTimeout(timer);
    }
  }, [onAutoSave, autoSaveDelay]);

  // Setup input handler - still tracks changes but doesn't auto-save
  const handleInput = () => {
    handleContentChange();
    debouncedAutoSave(); // This will only trigger autosave if it's enabled
  };

  return (
    <div 
      className="p-4 min-h-[300px] focus:outline-none overflow-auto text-sm"
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onBlur={handleContentChange}
      style={{ 
        lineHeight: '1.5',
        // Add these styles to better handle tables
        overflowX: 'auto',
        whiteSpace: 'normal',
        // Removed the top padding completely to eliminate the empty space
        paddingTop: "0"
      }}
      data-placeholder="Start writing..."
    >
      {/* Style definitions for headings within the editor */}
      <style>{`
        [contenteditable="true"] h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] h2 {
          font-size: 1.25rem;
          font-weight: 500;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] p {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] .chapter-separator {
          width: 100%;
          margin: 1.5rem 0;
          text-align: center;
          position: relative;
          overflow: hidden;
          height: 20px;
        }
        [contenteditable="true"] .chapter-separator hr {
          margin: 0;
          border: none;
          border-top: 1px solid #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default EditorContent;
