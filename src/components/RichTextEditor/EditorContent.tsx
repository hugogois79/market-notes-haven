
import React, { RefObject, useEffect } from "react";

export interface EditorContentProps {
  editorRef: RefObject<HTMLDivElement>;
  handleContentChange: () => void;
  initialContent?: string;
}

const EditorContent: React.FC<EditorContentProps> = ({
  editorRef,
  handleContentChange,
  initialContent = ""
}) => {
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent, editorRef]);

  return (
    <div
      ref={editorRef}
      contentEditable
      className="flex-1 p-4 focus:outline-none rich-text-editor overflow-auto bg-background border rounded-md min-h-[200px]"
      onInput={handleContentChange}
      onBlur={handleContentChange}
      suppressContentEditableWarning
    />
  );
};

export default EditorContent;
