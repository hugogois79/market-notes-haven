
import React, { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import ContentStyles from "./ContentStyles";
import { useContentChange } from "./useContentChange";
import { processExistingListsFormatting } from "../hooks/formatting/formatters";

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
  
  // Track last applied content to avoid overwriting user edits
  const lastAppliedContentRef = useRef<string>('');
  
  // Set initial content when the component mounts and ensure it's editable
  useEffect(() => {
    if (editorRef.current) {
      // Sanitize content before setting innerHTML to prevent XSS
      const sanitizedContent = DOMPurify.sanitize(content || '', {
        ALLOWED_TAGS: ['p', 'div', 'span', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
                      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'ul', 'ol', 'li',
                      'br', 'hr', 'input', 'label', 'a', 'img'],
        ALLOWED_ATTR: ['class', 'style', 'type', 'checked', 'href', 'target', 'data-*', 'src', 'alt']
      });
      
      // Only apply content if:
      // 1. Content is genuinely different from what we last applied (note changed)
      // 2. AND editor is NOT focused (user not actively editing)
      const isFocused = document.activeElement === editorRef.current;
      const contentChanged = sanitizedContent !== lastAppliedContentRef.current;
      
      if (contentChanged && !isFocused) {
        editorRef.current.innerHTML = sanitizedContent;
        lastAppliedContentRef.current = sanitizedContent;
      } else if (!lastAppliedContentRef.current && sanitizedContent) {
        // Initial load - always apply
        editorRef.current.innerHTML = sanitizedContent;
        lastAppliedContentRef.current = sanitizedContent;
      }
      
      // Process any checkboxes that might be in the content
      processCheckboxes();
      
      // Format any existing lists to maintain bullet points
      processExistingListsFormatting(editorRef);
      
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
            } catch (error) {
              console.error("Error positioning cursor:", error);
            }
          }
        }
      }, 100);
    }
  }, [content, processCheckboxes, editorRef]);

  // Add an effect to ensure the editor remains editable and lists have bullet points
  useEffect(() => {
    const ensureEditableInterval = setInterval(() => {
      if (editorRef.current) {
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.setAttribute('contenteditable', 'true');
          editorRef.current.contentEditable = 'true';
        }
        
        // Continuously check and format lists to maintain bullet points
        processExistingListsFormatting(editorRef);
      }
    }, 1000);
    
    return () => clearInterval(ensureEditableInterval);
  }, [editorRef]);

  // All-purpose click handler
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editorRef.current) {
      editorRef.current.contentEditable = 'true';
      editorRef.current.focus();
    }
  };

  return (
    <>
      <ContentStyles />
      <div 
        className="min-h-[300px] h-full w-full focus:outline-none editor-content"
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
          overflowY: 'visible',
          whiteSpace: 'pre-wrap',
          padding: "8px 12px",
          paddingBottom: "140px", /* Increased padding at bottom to make room for the bottom toolbar */
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
