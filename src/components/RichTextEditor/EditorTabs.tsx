import React, { useState, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import { useEditor } from "./hooks/editor/useEditorCore";
import { useToast } from "@/components/ui/use-toast";
import { uploadNoteAttachment, deleteNoteAttachment } from "@/services/supabaseService";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Paperclip, FileText, LineChart } from "lucide-react";
import TradingChat from "./TradingChat";
import { supabase } from "@/integrations/supabase/client";
import JournalSummary from "./JournalSummary";

interface EditorTabsProps {
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate: (content: string) => void;
  onAutoSave?: () => void;
  noteId?: string;
  attachment_url?: string;
  onAttachmentChange?: (url: string | null) => void;
  hasConclusion?: boolean;
  category?: string;
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
  category,
}: EditorTabsProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("editor");
  const [chatSummary, setChatSummary] = useState<string>("");

  const { 
    execCommand, 
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText
  } = useEditor(editorRef, hasConclusion);

  const handleContentChangeCallback = useCallback(() => {
    onContentChange(content);
    if (onAutoSave) {
      onAutoSave();
    }
  }, [content, onContentChange, onAutoSave]);

  const { mutate: uploadAttachment, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      if (!noteId) throw new Error("Note ID is required for attachment upload");
      return uploadNoteAttachment(file, noteId);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && noteId) {
      uploadAttachment(file);
    }
  };

  const handleDeleteAttachment = async () => {
    if (!noteId || !attachment_url) return;

    try {
      await deleteNoteAttachment(attachment_url);
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

  const handleChatSummaryUpdated = (summary: string) => {
    setChatSummary(summary);
  };

  const generateChatSummary = async () => {
    if (!noteId) return;
    
    try {
      const { data, error } = await supabase
        .from('trading_chat_messages')
        .select('*')
        .eq('note_id', noteId)
        .eq('is_ai', true)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching chat history:", error);
        return;
      }
      
      if (!data || data.length === 0) return;
      
      const aiMessages = data.map(msg => msg.content);
      
      const response = await supabase.functions.invoke('summarize-note', {
        body: { 
          content: aiMessages.join("\n\n"),
          maxLength: 250,
          summarizeTradeChat: true,
          formatAsBulletPoints: true
        },
      });
      
      if (response.error) {
        console.error("Error generating chat summary:", response.error);
        return;
      }
      
      const summary = response.data?.summary || "";
      setChatSummary(summary);
    } catch (error) {
      console.error("Error generating chat summary:", error);
    }
  };

  // Load the summary when the component mounts or noteId changes
  useEffect(() => {
    if (noteId && isTradingCategory) {
      generateChatSummary();
    }
  }, [noteId]);

  // Check if the current category is Trading or Pair Trading
  const isTradingCategory = category === "Trading" || category === "Pair Trading";

  return (
    <div className="flex flex-col w-full border rounded-md overflow-hidden bg-white">
      <Tabs defaultValue="editor" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center border-b bg-gray-50">
          <TabsList className="bg-transparent border-0">
            <TabsTrigger value="editor" className="text-base">
              <FileText className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="attachment" className="text-base">
              <Paperclip className="h-4 w-4 mr-2" />
              Attachment
            </TabsTrigger>
            {isTradingCategory && (
              <TabsTrigger value="trading" className="text-base">
                <LineChart className="h-4 w-4 mr-2" />
                Trading
              </TabsTrigger>
            )}
          </TabsList>
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
        
        {isTradingCategory && (
          <TabsContent value="trading" className="m-0 p-4">
            {/* Journal Summary Section - Show at the top */}
            <div className="mb-4">
              <JournalSummary 
                summary={chatSummary} 
                onRefresh={() => generateChatSummary()}
              />
            </div>
            
            {/* Trading Chat Section */}
            <TradingChat 
              noteId={noteId} 
              onChatSummaryUpdated={handleChatSummaryUpdated}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EditorTabs;
