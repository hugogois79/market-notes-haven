
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

  // Improved click handler to properly position the cursor at the click position
  const handleEditorClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent parent handlers
    
    if (editorRef.current) {
      // Ensure content is editable when clicked
      editorRef.current.contentEditable = 'true';
      
      // Focus the editor
      editorRef.current.focus();
      
      // Use the selection API to place cursor at click position
      const selection = window.getSelection();
      if (selection) {
        try {
          // Get precise click position using caretRangeFromPoint (more accurate)
          const caretRange = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (caretRange) {
            selection.removeAllRanges();
            selection.addRange(caretRange);
            return;
          }
        } catch (err) {
          console.log("Error setting cursor position:", err);
        }
        
        // Fallback: try to find the clicked element and set cursor position
        let clickedNode = e.target as Node;
        if (clickedNode && editorRef.current.contains(clickedNode)) {
          const newRange = document.createRange();
          
          // If we clicked text node directly
          if (clickedNode.nodeType === Node.TEXT_NODE) {
            try {
              // Try to position at the right offset in text
              const textNode = clickedNode as Text;
              // Calculate approximate text position
              const textRect = newRange.getBoundingClientRect();
              const ratio = (e.clientX - textRect.left) / (textRect.width || 1);
              const offset = Math.floor(ratio * textNode.length);
              
              newRange.setStart(textNode, Math.min(offset, textNode.length));
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              return;
            } catch (err) {
              console.log("Error setting text node position:", err);
            }
          }
          
          // Fallback to simply placing cursor at the element
          try {
            if (clickedNode.nodeType === Node.ELEMENT_NODE) {
              newRange.selectNodeContents(clickedNode);
              newRange.collapse(false); // collapse to end
              selection.removeAllRanges();
              selection.addRange(newRange);
              return;
            }
          } catch (err) {
            console.log("Error setting element position:", err);
          }
        }
        
        // Last resort fallback - just put cursor somewhere in editor
        try {
          const lastResortRange = document.createRange();
          lastResortRange.selectNodeContents(editorRef.current);
          lastResortRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(lastResortRange);
        } catch (err) {
          console.log("Final fallback error:", err);
        }
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
