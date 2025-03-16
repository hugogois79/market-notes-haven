
import { useEffect, RefObject, useCallback } from "react";

interface EditorContentProps {
  editorRef: RefObject<HTMLDivElement>;
  handleContentChange: () => void; // No parameters expected
  initialContent: string;
  onAutoSave?: () => void; // No parameters expected
  autoSaveDelay?: number;
  onContentUpdate?: (content: string) => void;
  execCommand?: (command: string, value?: string) => void;
  formatTableCells?: (alignment: string) => void;
}

const EditorContent = ({ 
  editorRef, 
  handleContentChange, 
  initialContent,
  onAutoSave,
  autoSaveDelay = 3000,
  onContentUpdate,
  execCommand,
  formatTableCells,
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
        onAutoSave(); // Call without arguments
      }, autoSaveDelay);
      
      return () => clearTimeout(timer);
    }
  }, [onAutoSave, autoSaveDelay]);

  // Setup keyboard shortcuts for text formatting
  useEffect(() => {
    if (!editorRef.current || !execCommand || !formatTableCells) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply shortcuts when editor is focused
      if (!editorRef.current?.contains(document.activeElement)) return;
      
      // Handle ALT key combinations
      if (e.altKey) {
        // Log key press for debugging
        console.log('ALT key combination:', e.key, 'KeyCode:', e.keyCode);
        
        switch (e.key.toLowerCase()) { // Convert to lowercase to handle both upper and lowercase
          case '1': // Heading 1
            e.preventDefault();
            execCommand('formatBlock', '<h1>');
            break;
          case '2': // Heading 2
            e.preventDefault();
            execCommand('formatBlock', '<h2>');
            break;
          case '3': // Heading 3 (new)
            e.preventDefault();
            execCommand('formatBlock', '<h3>');
            break;
          case '0': // Normal text
            e.preventDefault();
            execCommand('formatBlock', '<p>');
            break;
          case 'b': // Bold text (new)
            e.preventDefault();
            execCommand('bold');
            break;
          case 'c': // Center align
            e.preventDefault();
            formatTableCells('center');
            break;
          case 'l': // Left align
            e.preventDefault();
            formatTableCells('left');
            break;
          case 'r': // Right align
            e.preventDefault();
            formatTableCells('right');
            break;
          case 'j': // Justify
            e.preventDefault();
            formatTableCells('justify');
            break;
          case 'h': // Highlight text
            e.preventDefault();
            // Access the parent component's highlightText function via the editorRef
            const editor = editorRef.current as any;
            if (editor && editor.__highlightText) {
              editor.__highlightText();
            }
            break;
          case 'u': // Underline text
            e.preventDefault();
            execCommand('underline');
            break;
        }
      }
    };
    
    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorRef, execCommand, formatTableCells]);

  // Setup input handler - still tracks changes but doesn't auto-save
  const handleInput = () => {
    handleContentChange(); // Call without arguments
    
    // Notify parent component about content change
    if (onContentUpdate && editorRef.current) {
      onContentUpdate(editorRef.current.innerHTML);
    }
    
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
      {/* Style definitions for headings and lists within the editor */}
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
        [contenteditable="true"] h3 {
          font-size: 1.05rem;
          font-weight: 500;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        [contenteditable="true"] p {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin: 0.5rem 0;
        }
        [contenteditable="true"] ol {
          list-style-type: decimal;
          padding-left: 2rem;
          margin: 0.5rem 0;
        }
        [contenteditable="true"] li {
          margin-bottom: 0.25rem;
        }
        [contenteditable="true"] table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        [contenteditable="true"] th, 
        [contenteditable="true"] td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
        }
        [contenteditable="true"] th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        [contenteditable="true"] .text-left {
          text-align: left;
        }
        [contenteditable="true"] .text-center {
          text-align: center;
        }
        [contenteditable="true"] .text-right {
          text-align: right;
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
        [contenteditable="true"] .highlight {
          background-color: #FEF7CD;
          border-bottom: 2px solid #FEF7CD;
        }
        [contenteditable="true"] b,
        [contenteditable="true"] strong {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default EditorContent;
