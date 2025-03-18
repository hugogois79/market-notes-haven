
import React, { useState, useCallback, useRef } from "react";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import PrintModal from "./PrintModal";
import { useEditor } from "./hooks/editor/useEditorCore";
import { useToast } from "@/components/ui/use-toast";
import { uploadNoteAttachment, deleteNoteAttachment } from "@/services/supabaseService";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface EditorTabsProps {
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate: (content: string) => void;
  onAutoSave?: () => void;
  noteId?: string;
  attachment_url?: string;
  onAttachmentChange?: (url: string | null) => void;
  hasConclusion?: boolean;
}

const EditorTabs = ({
  content,
  onContentChange,
  onContentUpdate,
  onAutoSave,
  noteId,
  attachment_url,
  onAttachmentChange,
  hasConclusion = true,
}: EditorTabsProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { toast } = useToast();

  // Initialize editor hooks
  const { 
    execCommand, 
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText
  } = useEditor(editorRef, hasConclusion);

  // Handle content change
  const handleContentChangeCallback = useCallback(() => {
    onContentChange(content);
  }, [content, onContentChange]);

  return (
    <div className="flex flex-col w-full border rounded-md overflow-hidden">
      <div className="flex justify-between items-center bg-secondary p-2">
        <div className="flex-1">
          <span className="font-medium text-sm">Write</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsPrintModalOpen(true)}
          className="ml-auto"
        >
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
      </div>
      
      <EditorToolbar
        editorRef={editorRef}
        execCommand={execCommand}
        formatTableCells={formatTableCells}
        insertVerticalSeparator={insertVerticalSeparator}
        highlightText={highlightText}
        boldText={boldText}
      />
      
      <EditorContent
        editorRef={editorRef}
        handleContentChange={handleContentChangeCallback}
        initialContent={content}
        onAutoSave={onAutoSave}
        onContentUpdate={onContentUpdate}
        execCommand={execCommand}
        formatTableCells={formatTableCells}
        hasConclusion={hasConclusion}
      />

      {/* Print Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        content={content}
        title={""}
        category={""}
        attachmentUrl={attachment_url}
      />
    </div>
  );
};

export default EditorTabs;
