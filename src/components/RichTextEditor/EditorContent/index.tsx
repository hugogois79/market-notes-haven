
import React, { useEffect, useRef } from "react";
import ContentStyles from "./ContentStyles";
import { useContentChange } from "./useContentChange";

interface EditorContentProps {
  content: string;
  onChange: (content: string) => void; 
  onContentUpdate?: (content: string) => void;
  onAutoSave?: () => void; 
  autoSaveDelay?: number;
  hasConclusion?: boolean;
  editorRef?: React.RefObject<HTMLDivElement>;
}

/**
 * A rich text editor component that provides content editing capabilities
 */
const EditorContent: React.FC<EditorContentProps> = ({ 
  content,
  onChange, 
  onContentUpdate,
  onAutoSave,
  autoSaveDelay = 3000,
  hasConclusion = true,
  editorRef: externalEditorRef,
}) => {
  const internalEditorRef = useRef<HTMLDivElement>(null);
  const editorRef = externalEditorRef || internalEditorRef;
  
  // Handle content changes
  const { handleContentChange, processCheckboxes } = useContentChange({
    onChange,
    onContentUpdate,
    onAutoSave,
    autoSaveDelay,
    editorRef
  });
  
  // Set initial content when the component mounts and ensure it's editable
  useEffect(() => {
    if (editorRef.current) {
      // Only set innerHTML if it's different from current content to prevent cursor jumping
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content || '';
      }
      
      // Process any checkboxes that might be in the content
      processCheckboxes();
      
      // Force editor to be editable - try multiple approaches
      editorRef.current.setAttribute('contenteditable', 'true');
      editorRef.current.contentEditable = 'true';
      
      // Force focus into the editor once loaded if it's empty
      if (!content || content === '') {
        editorRef.current.focus();
      }
      
      // Apply other necessary attributes
      editorRef.current.style.userSelect = 'text';
      editorRef.current.style.webkitUserSelect = 'text';
      editorRef.current.style.cursor = 'text';
      
      console.log("Editor initialized with content and set to editable");
    }
  }, [content, processCheckboxes, editorRef]);

  // Add an additional effect to ensure the editor is always editable
  useEffect(() => {
    // Immediate check and fix
    if (editorRef.current && editorRef.current.contentEditable !== 'true') {
      editorRef.current.contentEditable = 'true';
      console.log("Fixed contentEditable on mount");
    }
    
    const ensureEditableInterval = setInterval(() => {
      if (editorRef.current) {
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
          console.log("Re-enabled contentEditable on editor");
        }
        
        // Also make sure no parent elements have contenteditable="false"
        let parent = editorRef.current.parentElement;
        while (parent) {
          if (parent.getAttribute('contenteditable') === 'false') {
            parent.setAttribute('contenteditable', 'true');
            console.log("Fixed parent contentEditable");
          }
          parent = parent.parentElement;
        }
      }
    }, 500); // Run more frequently
    
    return () => clearInterval(ensureEditableInterval);
  }, [editorRef]);

  // Add a click handler to ensure the editor gets focus
  const handleEditorClick = (e: React.MouseEvent) => {
    if (editorRef.current) {
      // Ensure content is editable when clicked
      if (editorRef.current.contentEditable !== 'true') {
        editorRef.current.contentEditable = 'true';
      }
      
      // Focus the editor
      editorRef.current.focus();
      
      // Make sure the cursor is placed at the click position
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.setStart(e.target as Node, 0);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  return (
    <>
      <ContentStyles />
      <div 
        className="p-4 min-h-[300px] h-full w-full focus:outline-none overflow-auto text-sm editor-content"
        ref={editorRef}
        contentEditable="true"
        suppressContentEditableWarning={true}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onClick={handleEditorClick}
        onFocus={() => {
          // Ensure we can type when the editor gets focus
          if (editorRef.current) {
            editorRef.current.contentEditable = 'true';
          }
        }}
        style={{ 
          lineHeight: '1.5',
          overflowX: 'auto',
          overflowY: 'auto',
          whiteSpace: 'normal',
          paddingTop: "8px",
          wordWrap: "break-word",
          wordBreak: "break-word",
          maxWidth: "100%",
          outline: "none",
          cursor: "text",
          userSelect: "text",
          WebkitUserSelect: "text"
        }}
        data-placeholder="Start writing..."
      />
    </>
  );
};

export default EditorContent;
