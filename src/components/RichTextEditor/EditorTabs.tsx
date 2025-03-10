
import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileEdit, Paintbrush, Table2 } from "lucide-react";
import FormattingToolbar from "./FormattingToolbar";
import EditorContent from "./EditorContent";
import AttachmentSection from "./AttachmentSection";
import TableDialog from "./TableDialog";

interface EditorTabsProps {
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate: (content: string) => void;
  onAutoSave: () => void;
  noteId: string;
  attachment_url?: string;
  onAttachmentChange: (url: string | null) => void;
}

const EditorTabs = ({
  content,
  onContentChange,
  onContentUpdate,
  onAutoSave,
  noteId,
  attachment_url,
  onAttachmentChange,
}: EditorTabsProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"visual" | "markdown">("visual");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  
  const { execCommand, formatTableCells, insertVerticalSeparator } = useEditor(editorRef);

  const handleCreateTable = () => {
    execCommand('insertHTML', createTable(rows, cols));
    setIsTableDialogOpen(false);
  };

  return (
    <Tabs defaultValue="edit" className="w-full">
      <div className="border-b px-3">
        <div className="flex items-center justify-between">
          <TabsList className="w-auto h-14">
            <TabsTrigger value="edit" className="data-[state=active]:bg-brand/10 data-[state=active]:text-brand">Editor</TabsTrigger>
            <TabsTrigger value="attachment" className="data-[state=active]:bg-brand/10 data-[state=active]:text-brand">Attachment</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-1 mr-2">
            <button
              type="button"
              className={`p-1 rounded ${selectedTab === "visual" ? "bg-brand/10 text-brand" : "hover:bg-muted"}`}
              onClick={() => setSelectedTab("visual")}
              title="Visual Editor"
            >
              <Paintbrush size={16} />
            </button>
            <button
              type="button"
              className={`p-1 rounded ${selectedTab === "markdown" ? "bg-brand/10 text-brand" : "hover:bg-muted"}`}
              onClick={() => setSelectedTab("markdown")}
              title="Markdown Editor"
            >
              <FileEdit size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <TabsContent value="edit" className="space-y-0 m-0">
        <FormattingToolbar 
          execCommand={execCommand} 
          setIsTableDialogOpen={setIsTableDialogOpen}
          formatTableCells={formatTableCells}
          insertVerticalSeparator={insertVerticalSeparator}
        />
        
        <EditorContent 
          editorRef={editorRef}
          handleContentChange={onContentChange}
          initialContent={content}
          onAutoSave={onAutoSave}
          autoSaveDelay={2000}
          onContentUpdate={onContentUpdate}
          execCommand={execCommand}
          formatTableCells={formatTableCells}
        />
        
        <TableDialog 
          isOpen={isTableDialogOpen} 
          onClose={() => setIsTableDialogOpen(false)} 
          rows={rows}
          cols={cols}
          setRows={setRows}
          setCols={setCols}
          onCreateTable={handleCreateTable}
        />
      </TabsContent>
      
      <TabsContent value="attachment" className="space-y-4 m-0 p-4">
        <AttachmentSection 
          noteId={noteId}
          attachmentUrl={attachment_url}
          onAttachmentChange={onAttachmentChange}
        />
      </TabsContent>
    </Tabs>
  );
};

// Helper function to create an HTML table
const createTable = (rows: number, cols: number) => {
  let tableHTML = '<table style="border-collapse: collapse; width: auto; margin: 1rem 0;">';
  
  // Table header
  tableHTML += '<thead>';
  tableHTML += '<tr>';
  for (let i = 0; i < cols; i++) {
    tableHTML += '<th style="border: 1px solid #d1d5db; padding: 0.5rem 1rem; background-color: #f3f4f6; font-weight: bold; text-align: left;">Header ' + (i + 1) + '</th>';
  }
  tableHTML += '</tr>';
  tableHTML += '</thead>';
  
  // Table body
  tableHTML += '<tbody>';
  for (let i = 0; i < rows - 1; i++) {
    tableHTML += '<tr>';
    for (let j = 0; j < cols; j++) {
      tableHTML += '<td style="border: 1px solid #d1d5db; padding: 0.5rem 1rem; text-align: left;">Cell ' + (i + 1) + '-' + (j + 1) + '</td>';
    }
    tableHTML += '</tr>';
  }
  tableHTML += '</tbody>';
  
  tableHTML += '</table>';
  return tableHTML;
};

// Import the useEditor hook
import { useEditor } from "./hooks/useEditor";

export default EditorTabs;
