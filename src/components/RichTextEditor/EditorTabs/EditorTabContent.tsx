
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import EditorContent from "../EditorContent";
import { TabContentProps } from "./types";

const EditorTabContent: React.FC<TabContentProps> = ({
  editorRef,
  content,
  onContentChange,
  onContentUpdate,
  onAutoSave,
  hasConclusion,
  category,
  handleContainerClick,
  execCommand,
  formatTableCells,
  insertVerticalSeparator,
  highlightText,
  boldText,
  underlineText,
  yellowUnderlineText
}) => {
  return (
    <ScrollArea className="flex-1 overflow-y-auto h-full editor-content-scroll-area">
      <div 
        className="px-2 pt-1" 
        onClick={handleContainerClick} 
        style={{ cursor: 'text', paddingBottom: '100px' }}
      >
        <EditorContent 
          content={content} 
          onChange={onContentChange} 
          onContentUpdate={onContentUpdate}
          onAutoSave={onAutoSave}
          hasConclusion={hasConclusion}
          editorRef={editorRef}
        />
      </div>
    </ScrollArea>
  );
};

export default EditorTabContent;
