
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Paperclip, Printer } from "lucide-react";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import AttachmentSection from "./AttachmentSection";

interface EditorTabsProps {
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate?: (content: string) => void;
  onAutoSave?: () => void;
  noteId?: string;
  attachment_url?: string;
  onAttachmentChange?: (url: string | null) => void;
  hasConclusion?: boolean;
  category?: string;
  onPrint?: () => void;
}

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

  return (
    <Tabs defaultValue="editor" className="w-full" onValueChange={setActiveTab}>
      <div className="flex justify-between items-center px-4 pt-2 border-b">
        <TabsList className="grid grid-cols-2 w-auto">
          <TabsTrigger value="editor" className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            <span>Editor</span>
          </TabsTrigger>
          <TabsTrigger value="attachment" className="flex items-center gap-1">
            <Paperclip className="h-4 w-4" />
            <span>Attachment</span>
          </TabsTrigger>
        </TabsList>
        
        {onPrint && (
          <button 
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm px-2 py-1 rounded-md hover:bg-muted transition-colors"
            onClick={onPrint}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print</span>
          </button>
        )}
      </div>
      
      <TabsContent value="editor" className="mt-0 p-0">
        <EditorToolbar 
          className="border-b"
          hasConclusion={hasConclusion}
          category={category}
        />
        <div className="p-4">
          <EditorContent 
            content={content} 
            onChange={onContentChange} 
            onContentUpdate={onContentUpdate}
            onAutoSave={onAutoSave}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="attachment" className="mt-0 p-4">
        <AttachmentSection 
          noteId={noteId}
          currentUrl={attachment_url}
          onUrlChange={onAttachmentChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default EditorTabs;
