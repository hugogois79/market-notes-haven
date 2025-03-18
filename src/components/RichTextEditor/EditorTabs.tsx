
import React, { useState, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import PrintModal from "./PrintModal";
import { useEditor } from "./hooks/editor/useEditorCore";
import { useToast } from "@/components/ui/use-toast";
import { uploadNoteAttachment, deleteNoteAttachment } from "@/services/supabaseService";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Paperclip, Printer } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("editor");

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

  // Handle file upload for attachments
  const { mutate: uploadAttachment, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      if (!noteId) throw new Error("Note ID is required for attachment upload");
      return uploadNoteAttachment(noteId, file);
    },
    onSuccess: (url) => {
      if (onAttachmentChange) {
        onAttachmentChange(url);
        toast({
          title: "Attachment uploaded",
          description: "Your file has been successfully uploaded.",
        });
      }
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && noteId) {
      uploadAttachment(file);
    }
  };

  // Handle attachment deletion
  const handleDeleteAttachment = async () => {
    if (!noteId || !attachment_url) return;

    try {
      await deleteNoteAttachment(noteId);
      if (onAttachmentChange) {
        onAttachmentChange(null);
        toast({
          title: "Attachment deleted",
          description: "Your file has been successfully deleted.",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Deletion failed",
        description: "There was an error deleting your file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col w-full border rounded-md overflow-hidden">
      <Tabs defaultValue="editor" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center bg-secondary p-2">
          <TabsList className="bg-transparent">
            <TabsTrigger 
              value="editor" 
              className="text-xs px-3 py-1 data-[state=active]:bg-background data-[state=active]:shadow-none"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger 
              value="attachment" 
              className="text-xs px-3 py-1 data-[state=active]:bg-background data-[state=active]:shadow-none"
            >
              Attachment
            </TabsTrigger>
          </TabsList>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsPrintModalOpen(true)}
            className="ml-auto"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Print</span>
          </Button>
        </div>
        
        <TabsContent value="editor" className="m-0">
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
        </TabsContent>
        
        <TabsContent value="attachment" className="m-0 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">File Attachment</h3>
              <div>
                {attachment_url ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAttachment}
                    className="text-xs"
                  >
                    Delete Attachment
                  </Button>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={isUploading}
                    >
                      <Paperclip className="h-3.5 w-3.5 mr-1" />
                      {isUploading ? "Uploading..." : "Upload File"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {attachment_url && (
              <div className="border rounded-md p-3 flex items-center justify-between bg-secondary/50">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <a
                    href={attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline truncate max-w-[300px]"
                  >
                    {attachment_url.split("/").pop()}
                  </a>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="text-xs"
                >
                  <a
                    href={attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </Button>
              </div>
            )}
            
            {!attachment_url && !isUploading && (
              <div className="text-center py-6 border border-dashed rounded-md">
                <Paperclip className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-2">
                  No attachment yet. Upload a file to attach it to this note.
                </p>
              </div>
            )}
            
            {isUploading && (
              <div className="text-center py-6 border border-dashed rounded-md">
                <p className="text-xs text-muted-foreground">Uploading...</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
