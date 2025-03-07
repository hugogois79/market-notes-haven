import { useEffect, RefObject } from "react";

interface EditorContentProps {
  editorRef: RefObject<HTMLDivElement>;
  handleContentChange: () => void;
  initialContent: string;
}

const EditorContent = ({ editorRef, handleContentChange, initialContent }: EditorContentProps) => {
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

  return (
    <div 
      className="p-4 min-h-[300px] focus:outline-none overflow-auto"
      ref={editorRef}
      contentEditable
      onInput={handleContentChange}
      onBlur={handleContentChange}
      style={{ lineHeight: '1.5' }}
      data-placeholder="Start writing..."
    />
  );
};

export default EditorContent;
