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
  hasConclusion?: boolean; // Keeping the prop but we won't use it for highlighting
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
  hasConclusion = true, // Default to true to not interfere with existing content
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

  // Setup input handler - still tracks changes but doesn't auto-save
  const handleInput = () => {
    handleContentChange(); // Call without arguments
    
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
        // Reduced top padding
        paddingTop: "8px"
      }}
      data-placeholder="Start writing..."
    >
      {/* Style definitions for headings and lists within the editor */}
      <style>{`
        [contenteditable="true"] h1 {
          font-size: 1.4rem;
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
          font-size: 1.1rem;
          font-weight: 500;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        [contenteditable="true"] p {
          font-size: 1rem;
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
          font-size: 1rem;
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
          font-size: 1rem;
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
        [contenteditable="true"] .text-justify {
          text-align: justify;
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
        
        /* Styling for conclusion section */
        [contenteditable="true"] .conclusion-heading {
          color: #1967d2;
        }
        
        [contenteditable="true"] .conclusion-content {
          background-color: #D3E4FD;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        
        /* Styling for no-conclusion wrapper */
        [contenteditable="true"] .no-conclusion-wrapper {
          background-color: #D3E4FD;
          padding: 12px;
          border-radius: 4px;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        
        [contenteditable="true"] .conclusion-missing-note {
          background-color: #1967d2;
          color: white;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default EditorContent;
