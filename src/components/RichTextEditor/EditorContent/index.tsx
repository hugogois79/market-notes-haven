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
  
  // Set initial content when the component mounts
  useEffect(() => {
    if (editorRef.current) {
      // Convert string content to actual HTML
      editorRef.current.innerHTML = content || '';
      
      // Format any checkboxes that might be in the content
      processCheckboxes();
      
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
  }, [content, processCheckboxes]);

  return (
    <div 
      className="p-4 min-h-[300px] h-full w-full focus:outline-none overflow-auto text-sm editor-content"
      ref={editorRef}
      contentEditable
      onInput={handleContentChange}
      onBlur={handleContentChange}
      style={{ 
        lineHeight: '1.5',
        // Add these styles to better handle tables and overflow
        overflowX: 'auto',
        overflowY: 'auto',
        whiteSpace: 'normal',
        // Reduced top padding
        paddingTop: "8px",
        // Ensure content wraps within the container
        wordWrap: "break-word",
        wordBreak: "break-word",
        // Maximum width to prevent horizontal overflow
        maxWidth: "100%"
      }}
      data-placeholder="Start writing..."
    >
      {/* Style definitions for headings and lists within the editor */}
      <ContentStyles />
    </div>
  );
};

export default EditorContent;
