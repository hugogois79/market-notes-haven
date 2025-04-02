
import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Paperclip } from "lucide-react";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import AttachmentSection from "./AttachmentSection";
import { useEditor } from "./hooks/editor";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      // Force editability and focus when switching to editor tab
      editorRef.current.contentEditable = 'true';
      editorRef.current.setAttribute('contenteditable', 'true');
      
      // Remove any attributes that might interfere with editing
      editorRef.current.removeAttribute('readonly');
      editorRef.current.removeAttribute('disabled');
      
      // Short timeout to ensure DOM is ready before focusing
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          
          // Try to place cursor at beginning for empty content
          const selection = window.getSelection();
          if (selection && (!content || content.trim() === '')) {
            try {
              const range = document.createRange();
              
              // Create a text node if there isn't content
              if (!editorRef.current.firstChild) {
                const textNode = document.createTextNode('\u200B'); // Zero-width space
                editorRef.current.appendChild(textNode);
                range.setStart(textNode, 0);
              } else {
                range.setStart(editorRef.current.firstChild, 0);
              }
              
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } catch (error) {
              console.error("Error positioning cursor:", error);
            }
          }
        }
      }, 50);
    }
  }, [activeTab, content]);

  // Effect to continuously check and fix editability
  useEffect(() => {
    const editableCheckInterval = setInterval(() => {
      if (activeTab === "editor" && editorRef.current) {
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
        }
      }
    }, 5);
    
    return () => {
      clearInterval(editableCheckInterval);
    };
  }, [activeTab]);

  // Force focus via direct DOM manipulation when container clicked
  const handleContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (activeTab === "editor") {
      if (editorRef.current) {
        // Force editability at the DOM level
        editorRef.current.contentEditable = 'true';
        editorRef.current.setAttribute('contenteditable', 'true');
        
        // Remove any attributes that might interfere with editing
        editorRef.current.removeAttribute('readonly');
        editorRef.current.removeAttribute('disabled');
        
        // Focus immediately
        editorRef.current.focus();
      }
    }
  };

  return (
    <Tabs defaultValue="editor" className="w-full flex flex-col h-full" onValueChange={setActiveTab}>
      <div className="flex justify-between items-center px-2 pt-1 border-b sticky top-0 bg-background z-50">
        <TabsList className="grid grid-cols-2 w-auto h-7">
          <TabsTrigger value="editor" className="flex items-center gap-0.5 px-2 text-xs h-6">
            <Edit className="h-3.5 w-3.5" />
            <span>Editor</span>
          </TabsTrigger>
          <TabsTrigger value="attachment" className="flex items-center gap-0.5 px-2 text-xs h-6">
            <Paperclip className="h-3.5 w-3.5" />
            <span>Attachment</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent 
        value="editor" 
        className="mt-0 p-0 flex-1 overflow-hidden flex flex-col"
        onClick={handleContainerClick}
      >
        <div className="sticky top-[2.25rem] z-[90] bg-background">
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
        </div>
        <ScrollArea className="flex-1 overflow-y-auto h-full">
          <div 
            className="p-2 pt-0" 
            onClick={handleContainerClick} 
            style={{ cursor: 'text', paddingBottom: '200px' }}
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
      </TabsContent>
      
      <TabsContent value="attachment" className="mt-0 p-2 flex-1 overflow-auto">
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
