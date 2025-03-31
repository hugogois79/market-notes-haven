
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
      
      // Explicit force to enable editing
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
            
            try {
              if (selection) {
                // Create a text node if there isn't content to ensure cursor positioning works
                if (!editorRef.current.firstChild) {
                  const textNode = document.createTextNode('');
                  editorRef.current.appendChild(textNode);
                }
                
                if (editorRef.current.firstChild) {
                  range.setStart(editorRef.current.firstChild, 0);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                } else {
                  // Fallback if no firstChild
                  range.setStart(editorRef.current, 0);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }
              console.log("Cursor positioned at beginning");
            } catch (error) {
              console.error("Error positioning cursor:", error);
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
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.setAttribute('contenteditable', 'true');
          editorRef.current.contentEditable = 'true';
          console.log("Fixed editor editability");
        }
      }
    }, 10); // Check very frequently to ensure editability
    
    return () => clearInterval(ensureEditableInterval);
  }, [editorRef]);

  // All-purpose click handler
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editorRef.current) {
      editorRef.current.contentEditable = 'true';
      editorRef.current.focus();
      console.log("Editor clicked and focused");
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
        onClick={handleClick}
        onMouseDown={(e) => {
          // Prevent the browser from changing focus
          e.stopPropagation();
          if (editorRef.current) {
            editorRef.current.focus();
          }
        }}
        style={{ 
          lineHeight: '1.5',
          overflowX: 'auto',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap', // Change from normal to pre-wrap to preserve formatting
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
