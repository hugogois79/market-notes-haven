import React, { useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import PrintModal from "./PrintModal";
import { useEditor } from "./hooks/editor/useEditorCore";
import { useToast } from "@/components/ui/use-toast";
import { uploadNoteAttachment, deleteNoteAttachment } from "@/services/supabaseService";
import { useMutation } from "@tanstack/react-query";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Initialize editor hooks
  const { 
    execCommand, 
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText
  } = useEditor(editorRef, hasConclusion);

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!noteId) {
        throw new Error("Note ID is required to upload an attachment.");
      }
      return uploadNoteAttachment(file, noteId);
    },
    onSuccess: (newUrl) => {
      setIsUploading(false);
      if (newUrl) {
        onAttachmentChange?.(newUrl);
        toast({
          title: "Attachment Uploaded",
          description: "The attachment has been successfully uploaded.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "There was an error uploading the attachment.",
        });
      }
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload attachment.",
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (url: string) => {
      return deleteNoteAttachment(url);
    },
    onSuccess: () => {
      onAttachmentChange?.(null);
      toast({
        title: "Attachment Removed",
        description: "The attachment has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Deletion Error",
        description: error.message || "Failed to delete attachment.",
      });
    },
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadFileMutation.mutate(file);
  };

  // Handle file deletion
  const handleFileDelete = async () => {
    if (attachment_url) {
      deleteFileMutation.mutate(attachment_url);
    }
  };

  // Handle content change
  const handleContentChangeCallback = useCallback(() => {
    onContentChange(content);
  }, [content, onContentChange]);

  return (
    <Tabs defaultValue="write" className="w-full">
      <TabsList className="bg-secondary p-2 rounded-t-md">
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="attachment">Attachment</TabsTrigger>
        <Button variant="ghost" size="sm" onClick={() => setIsPrintModalOpen(true)}>
          Print
        </Button>
      </TabsList>
      
      {/* Write Tab */}
      <TabsContent value="write" className="p-0 outline-none">
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
      
      {/* Preview Tab */}
      <TabsContent value="preview" className="p-4">
        <div className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </TabsContent>
      
      {/* Attachment Tab */}
      <TabsContent value="attachment" className="p-4">
        <div className="flex flex-col gap-4">
          {attachment_url ? (
            <>
              <p>Current Attachment:</p>
              <a href={attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                View Attachment
              </a>
              <Button variant="destructive" onClick={handleFileDelete} disabled={deleteFileMutation.isPending}>
                {deleteFileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Remove Attachment"
                )}
              </Button>
            </>
          ) : (
            <>
              <p>Upload an attachment:</p>
              <input
                type="file"
                id="attachment-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label htmlFor="attachment-upload">
                <Button variant="outline" asChild disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Select File
                    </>
                  )}
                </Button>
              </label>
            </>
          )}
        </div>
      </TabsContent>

      {/* Print Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        content={content}
        title={""}
        category={""}
        attachmentUrl={attachment_url}
      />
    </Tabs>
  );
};

export default EditorTabs;
