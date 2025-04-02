
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Paperclip } from "lucide-react";
import { EditorTabsProps } from "./types";
import EditorTabContent from "./EditorTabContent";
import AttachmentTabContent from "./AttachmentTabContent";
import FloatingToolbarWrapper from "./FloatingToolbarWrapper";
import { useTabState, useCursorPlacement, useHandleContainerClick } from "./useTabState";

const EditorTabs: React.FC<EditorTabsProps> = ({
  content,
  onContentChange,
  onContentUpdate = () => {},
  onAutoSave = () => {},
  noteId = "",
  attachment_url,
  onAttachmentChange = () => {},
  hasConclusion = true,
  category = "General",
  onPrint,
}) => {
  const [activeTab, setActiveTab] = useState("editor");
  
  // Use custom hooks to manage state and behavior
  const {
    editorRef,
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText,
    underlineText
  } = useTabState(activeTab, hasConclusion);
  
  // Handle cursor placement for empty content
  useCursorPlacement(editorRef, content, activeTab);
  
  // Handle container click to force focus
  const { handleContainerClick } = useHandleContainerClick(editorRef, activeTab);

  return (
    <>
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
          onClick={handleContainerClick}
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
          />
        </TabsContent>
        
        <TabsContent value="attachment" className="mt-0 p-1 flex-1 overflow-auto">
          <AttachmentTabContent
            noteId={noteId}
            attachmentUrl={attachment_url}
            onAttachmentChange={onAttachmentChange}
          />
        </TabsContent>
      </Tabs>

      {activeTab === "editor" && (
        <FloatingToolbarWrapper
          editorRef={editorRef}
          boldText={boldText}
          underlineText={underlineText}
          highlightText={highlightText}
          execCommand={execCommand}
          formatTableCells={formatTableCells}
          insertVerticalSeparator={insertVerticalSeparator}
          isVisible={true}
        />
      )}
    </>
  );
};

export default EditorTabs;
