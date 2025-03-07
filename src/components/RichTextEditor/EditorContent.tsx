
import React, { RefObject } from "react";

interface EditorContentProps {
  editorRef: RefObject<HTMLDivElement>;
  handleContentChange: () => void;
}

const EditorContent: React.FC<EditorContentProps> = ({
  editorRef,
  handleContentChange
}) => {
  return (
    <div
      ref={editorRef}
      contentEditable
      className="flex-1 p-4 focus:outline-none rich-text-editor overflow-auto bg-background border rounded-md"
      onInput={handleContentChange}
      onBlur={handleContentChange}
      suppressContentEditableWarning
    />
  );
};

export default EditorContent;
