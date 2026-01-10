
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Paperclip } from "lucide-react";
import { EditorTabsProps } from "./types";
import EditorTabContent from "./EditorTabContent";
import AttachmentTabContent from "./AttachmentTabContent";
import { useTabState, useCursorPlacement, useHandleContainerClick } from "./useTabState";

const EditorTabs: React.FC<EditorTabsProps> = ({
  content,
  onContentChange,
  onContentUpdate = () => {},
  onAutoSave = () => {},
  noteId = "",
  attachment_url,
  attachments = [],
  onAttachmentChange = () => {},
  hasConclusion = true,
  category = "General",
  onPrint,
  // Use external refs/functions if provided, otherwise use internal ones
  editorRef: externalEditorRef,
  execCommand: externalExecCommand,
  formatTableCells: externalFormatTableCells,
  insertVerticalSeparator: externalInsertVerticalSeparator,
  highlightText: externalHighlightText,
  boldText: externalBoldText,
  underlineText: externalUnderlineText,
  yellowUnderlineText: externalYellowUnderlineText,
}) => {
  const [activeTab, setActiveTab] = useState("editor");
  
  // Use custom hooks to manage state and behavior
  const {
    editorRef: internalEditorRef,
    execCommand: internalExecCommand,
    formatTableCells: internalFormatTableCells,
    insertVerticalSeparator: internalInsertVerticalSeparator,
    highlightText: internalHighlightText,
    boldText: internalBoldText,
    underlineText: internalUnderlineText,
    yellowUnderlineText: internalYellowUnderlineText
  } = useTabState(activeTab, hasConclusion);
  
  // Use external if provided, otherwise internal
  const editorRef = externalEditorRef || internalEditorRef;
  const execCommand = externalExecCommand || internalExecCommand;
  const formatTableCells = externalFormatTableCells || internalFormatTableCells;
  const insertVerticalSeparator = externalInsertVerticalSeparator || internalInsertVerticalSeparator;
  const highlightText = externalHighlightText || internalHighlightText;
  const boldText = externalBoldText || internalBoldText;
  const underlineText = externalUnderlineText || internalUnderlineText;
  const yellowUnderlineText = externalYellowUnderlineText || internalYellowUnderlineText;
  
  // Handle cursor placement for empty content
  useCursorPlacement(editorRef, content, activeTab);
  
  // Handle container click to force focus
  const { handleContainerClick } = useHandleContainerClick(editorRef, activeTab);

  return (
    <Tabs defaultValue="editor" className="w-full flex flex-col h-full" onValueChange={setActiveTab}>
      <div className="flex justify-between items-center px-1 border-b sticky top-0 bg-background z-50">
        <TabsList className="grid grid-cols-2 w-auto h-6">
          <TabsTrigger value="editor" className="flex items-center gap-0.5 px-2 text-xs h-5">
            <Edit className="h-3 w-3" />
            <span>Editor</span>
          </TabsTrigger>
          <TabsTrigger value="attachment" className="flex items-center gap-0.5 px-2 text-xs h-5">
            <Paperclip className="h-3 w-3" />
            <span>Attachment</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent 
        value="editor" 
        className="mt-0 p-0 flex-1 overflow-hidden flex flex-col"
        onClick={(e) => handleContainerClick(e)}
      >
        <EditorTabContent
          editorRef={editorRef}
          content={content}
          onContentChange={onContentChange}
          onContentUpdate={onContentUpdate}
          onAutoSave={onAutoSave}
          hasConclusion={hasConclusion}
          category={category}
          handleContainerClick={handleContainerClick}
          execCommand={execCommand}
          formatTableCells={formatTableCells}
          insertVerticalSeparator={insertVerticalSeparator}
          highlightText={highlightText}
          boldText={boldText}
          underlineText={underlineText}
          yellowUnderlineText={yellowUnderlineText}
        />
      </TabsContent>
      
      <TabsContent value="attachment" className="mt-0 p-1 flex-1 overflow-auto">
        <AttachmentTabContent
          noteId={noteId}
          attachmentUrl={attachment_url}
          attachments={attachments}
          onAttachmentChange={onAttachmentChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default EditorTabs;
