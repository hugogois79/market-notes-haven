
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
          console.log("Tab changed to editor - forced focus");
          
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
              console.log("Cursor positioned for empty content");
            } catch (error) {
              console.error("Error positioning cursor:", error);
            }
          }
        }
      }, 50);
    }
  }, [activeTab, content]);

  // Effect to continuously check and fix editability - check extremely frequently
  useEffect(() => {
    const editableCheckInterval = setInterval(() => {
      if (activeTab === "editor" && editorRef.current) {
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
          console.log("Forced editor tab to be editable");
        }
      }
    }, 5); // Check extremely frequently (200 times per second)
    
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
        console.log("Container clicked - editor focused via DOM");
      }
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
      
      <TabsContent 
        value="editor" 
        className="mt-0 p-0 flex-1 overflow-hidden flex flex-col"
        onClick={handleContainerClick}
      >
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
        <div 
          className="flex-1 overflow-auto" 
          onClick={handleContainerClick} 
          style={{ cursor: 'text' }}
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
