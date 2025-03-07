
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
      editorRef.current.focus();
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
