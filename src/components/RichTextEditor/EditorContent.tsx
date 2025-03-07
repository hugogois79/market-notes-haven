
import React from "react";

interface EditorContentProps {
  editorRef: React.RefObject<HTMLDivElement>;
  content: string;
  handleContentChange: () => void;
}

const EditorContent = ({ editorRef, content, handleContentChange }: EditorContentProps) => {
  return (
    <div
      ref={editorRef}
      className="flex-grow p-4 rounded-md border border-border/50 bg-background/50 overflow-y-auto"
      contentEditable
      onInput={handleContentChange}
      onBlur={handleContentChange}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default EditorContent;
