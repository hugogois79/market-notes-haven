
import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Paperclip } from "lucide-react";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import AttachmentSection from "./AttachmentSection";
import { useEditor } from "./hooks/editor";

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
}) => {
  const [activeTab, setActiveTab] = useState("editor");
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Initialize editor with necessary functions
  const {
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText,
    underlineText,
    processCheckboxes
  } = useEditor(editorRef, hasConclusion);
  
  // Effect to ensure editor is editable when switching tabs
  useEffect(() => {
    if (activeTab === "editor" && editorRef.current) {
      // Short delay to ensure the DOM is ready
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
          editorRef.current.focus();
          
          // Ensure cursor is visible for editing
          const selection = window.getSelection();
          if (selection) {
            try {
              const range = document.createRange();
              
              // Try to find some content to place cursor
              const textNodes = Array.from(editorRef.current.querySelectorAll('*'))
                .filter(el => el.textContent && el.textContent.trim().length > 0);
              
              if (textNodes.length > 0) {
                // Place cursor at beginning of first text node
                range.setStart(textNodes[0], 0);
                range.collapse(true);
              } else {
                // Or just at the beginning of editor
                range.setStart(editorRef.current, 0);
                range.collapse(true);
              }
              
              selection.removeAllRanges();
              selection.addRange(range);
            } catch (err) {
              console.log("Error setting initial cursor position:", err);
            }
          }
          
          console.log("Editor tab active, ensuring contentEditable");
        }
      }, 50); // Reduced delay for better responsiveness
    }
  }, [activeTab]);
  
  // Additional check for editor editability after content changes
  useEffect(() => {
    if (activeTab === "editor" && editorRef.current) {
      // Make sure the editor is editable after content is loaded/updated
      editorRef.current.contentEditable = 'true';
    }
  }, [content, activeTab]);

  // Improved click handler for the container
  const handleContainerClick = (e: React.MouseEvent) => {
    if (activeTab !== "editor" || !editorRef.current) return;
    
    // Don't interfere if clicking on a button or control
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' || 
      target.closest('button') || 
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA'
    ) {
      return;
    }
    
    // Find if we clicked directly inside the editor
    if (!editorRef.current.contains(e.target as Node)) {
      // We clicked outside the editor but inside the container
      // so focus the editor
      editorRef.current.focus();
    }
  };

  return (
    <Tabs defaultValue="editor" className="w-full flex flex-col h-full" onValueChange={setActiveTab}>
      <div className="flex justify-between items-center px-4 pt-2 border-b sticky top-0 bg-background z-10">
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
      </div>
      
      <TabsContent value="editor" className="mt-0 p-0 flex-1 overflow-hidden flex flex-col">
        <EditorToolbar 
          editorRef={editorRef}
          execCommand={execCommand}
          formatTableCells={formatTableCells}
          insertVerticalSeparator={insertVerticalSeparator}
          highlightText={highlightText}
          boldText={boldText}
          underlineText={underlineText}
          hasConclusion={hasConclusion}
          category={category}
        />
        <div className="flex-1 overflow-auto" onClick={handleContainerClick}>
          <EditorContent 
            content={content} 
            onChange={onContentChange} 
            onContentUpdate={onContentUpdate}
            onAutoSave={onAutoSave}
            hasConclusion={hasConclusion}
            editorRef={editorRef}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="attachment" className="mt-0 p-4 flex-1 overflow-auto">
        <AttachmentSection 
          noteId={noteId}
          attachmentUrl={attachment_url}
          onAttachmentChange={onAttachmentChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default EditorTabs;
