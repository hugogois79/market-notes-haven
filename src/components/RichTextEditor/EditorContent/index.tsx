
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
      
      // Make sure the editor is definitely editable
      editorRef.current.setAttribute('contenteditable', 'true');
      editorRef.current.contentEditable = 'true';
      
      // Apply all necessary attributes for maximum compatibility
      editorRef.current.style.outline = 'none';
      editorRef.current.style.userSelect = 'text';
      editorRef.current.style.webkitUserSelect = 'text';
      editorRef.current.style.cursor = 'text';
      
      // Force focus when loaded with a slight delay to ensure the DOM is ready
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          
          // Try to position cursor at the beginning for new notes
          if (!content || content.trim() === '') {
            const selection = window.getSelection();
            const range = document.createRange();
            
            if (selection && editorRef.current.firstChild) {
              range.setStart(editorRef.current.firstChild, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } else if (selection) {
              // If no firstChild, set cursor at the beginning of the element
              range.setStart(editorRef.current, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }, 100);
      
      console.log("Editor initialized with content:", content ? "has content" : "empty", "and set to editable");
    }
  }, [content, processCheckboxes, editorRef]);

  // Add an effect to ensure the editor remains editable - check very frequently
  useEffect(() => {
    const ensureEditableInterval = setInterval(() => {
      if (editorRef.current) {
        editorRef.current.setAttribute('contenteditable', 'true');
        editorRef.current.contentEditable = 'true';
      }
    }, 50);
    
    return () => clearInterval(ensureEditableInterval);
  }, [editorRef]);

  const handleEditorClick = (e: React.MouseEvent) => {
    // Force editor to be editable when clicked
    if (editorRef.current) {
      editorRef.current.contentEditable = 'true';
      editorRef.current.focus();
      
      // Log state after click for debugging
      console.log("Editor clicked, contentEditable:", editorRef.current.contentEditable);
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
