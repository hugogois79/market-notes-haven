
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
      // Only set innerHTML if it's different from current content to prevent cursor jumping
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content || '';
      }
      
      // Format any checkboxes that might be in the content
      processCheckboxes();
    }
  }, [content, processCheckboxes]);

  return (
    <div 
      className="p-4 min-h-[300px] h-full w-full focus:outline-none overflow-auto text-sm editor-content"
      ref={editorRef}
      contentEditable="true"
      onInput={handleContentChange}
      onBlur={handleContentChange}
      style={{ 
        lineHeight: '1.5',
        overflowX: 'auto',
        overflowY: 'auto',
        whiteSpace: 'normal',
        paddingTop: "8px",
        wordWrap: "break-word",
        wordBreak: "break-word",
        maxWidth: "100%"
      }}
      data-placeholder="Start writing..."
    />
  );
};

export default EditorContent;
