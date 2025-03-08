
import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileEdit, Paintbrush, Table2, Save } from "lucide-react";
import TagsSection from "./TagsSection";
import FormattingToolbar from "./FormattingToolbar";
import EditorContent from "./EditorContent";
import TokenSection from "./TokenSection";
import EditorHeader from "./EditorHeader";
import AttachmentSection from "./AttachmentSection";
import TableDialog from "./TableDialog";
import { useEditor } from "./hooks/useEditor";
import { Tag, Token, Note } from "@/types";
import AiResume from "./AiResume";
import { useQuery } from "@tanstack/react-query";
import { fetchTags } from "@/services/tagService";
import { fetchTokens } from "@/services/tokenService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  linkedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  linkedTokens?: Token[];
  onTokensChange?: (tokens: Token[]) => void;
  noteId?: string;
  attachment_url?: string;
  onAttachmentChange?: (url: string | null) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  onSave?: () => void; 
  autoSave?: boolean;
}

const RichTextEditor = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  linkedTags,
  onTagsChange,
  linkedTokens = [],
  onTokensChange = () => {},
  noteId,
  attachment_url,
  onAttachmentChange = () => {},
  category,
  onCategoryChange,
  onSave,
  autoSave = true,
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"visual" | "markdown">("visual");
  const [tagInput, setTagInput] = useState("");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { execCommand, formatTableCells } = useEditor(editorRef);

  // Fetch available tags
  const { data: availableTags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  // Fetch available tokens
  const { data: availableTokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });

  // Handle autosave
  const handleAutoSave = useCallback(() => {
    if (autoSave && onSave) {
      setIsSaving(true);
      onSave();
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000); // Show saving indicator for 1 second
    }
  }, [autoSave, onSave]);

  // Manual save function
  const handleManualSave = () => {
    if (onSave) {
      setIsSaving(true);
      onSave();
      toast.success("Note saved successfully");
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  // Function to handle adding a new tag
  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    
    const tagName = tagInput.trim();
    // Fix type checking to handle the never type issue
    const tagExists = linkedTags.some((tag: any) => {
      if (typeof tag === 'string') {
        return tag.toLowerCase() === tagName.toLowerCase();
      } 
      
      if (tag && typeof tag === 'object' && 'name' in tag) {
        return tag.name.toLowerCase() === tagName.toLowerCase();
      }
      
      return false;
    });
    
    if (!tagExists) {
      // For simplicity, we're creating a new tag object here
      // In a real application, you might want to save this to a database
      const newTag: Tag = {
        id: Date.now().toString(),
        name: tagName
      };
      
      onTagsChange([...linkedTags, newTag]);
    }
    
    setTagInput("");
  };

  // Function to handle removing a tag
  const handleRemoveTag = (tagToRemove: string | Tag) => {
    const tagId = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id;
    const updatedTags = linkedTags.filter(tag => 
      typeof tag === 'string' ? tag !== tagId : tag.id !== tagId
    );
    
    onTagsChange(updatedTags);
  };

  // Function to handle selecting an existing tag
  const handleSelectTag = (tag: Tag) => {
    const tagExists = linkedTags.some(t => 
      typeof t === 'string' ? t === tag.id : t.id === tag.id
    );
    
    if (!tagExists) {
      onTagsChange([...linkedTags, tag]);
    }
    
    setTagInput("");
  };

  // Function to handle selecting a token
  const handleTokenSelect = (tokenId: string) => {
    // Find the token in the available tokens
    if (tokenId && availableTokens.length > 0) {
      const token = availableTokens.find(t => t.id === tokenId);
      if (token) {
        onTokensChange([...linkedTokens, token]);
      }
    }
  };

  const getAvailableTagsForSelection = () => {
    if (!tagInput.trim()) return [];
    
    const searchTerm = tagInput.toLowerCase();
    return availableTags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm) &&
      !linkedTags.some(linkedTag => 
        typeof linkedTag === 'string' 
          ? linkedTag === tag.id 
          : linkedTag.id === tag.id
      )
    );
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      onContentChange(editorRef.current.innerHTML);
    }
  };

  const handleCreateTable = () => {
    execCommand('insertHTML', createTable(rows, cols));
    setIsTableDialogOpen(false);
  };

  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    console.log("RichTextEditor received title change:", newTitle);
    onTitleChange(newTitle);
    
    // Trigger auto-save after title change
    if (autoSave && onSave) {
      setIsSaving(true);
      setTimeout(() => {
        onSave();
        setLastSaved(new Date());
        setIsSaving(false);
      }, 500);
    }
  }, [autoSave, onSave, onTitleChange]);

  return (
    <div className="flex flex-col gap-4 mt-2">
      <EditorHeader 
        title={title} 
        onTitleChange={handleTitleChange}
        category={category}
        onCategoryChange={onCategoryChange}
      />
      
      {/* Status and Save Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isSaving ? (
            <span className="text-brand">Saving...</span>
          ) : lastSaved ? (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
        
        <Button
          onClick={handleManualSave}
          disabled={isSaving}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
      
      {/* AI Resume Section - Placed at the top as requested */}
      <Card className="p-4 border rounded-md">
        <AiResume 
          noteId={noteId || ""}
          content={content}
        />
      </Card>
      
      {/* Tags and Tokens Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="p-4 border rounded-md flex-1">
          <TagsSection 
            linkedTags={linkedTags}
            tagInput={tagInput}
            setTagInput={setTagInput}
            handleAddTag={handleAddTag}
            handleRemoveTag={handleRemoveTag}
            handleSelectTag={handleSelectTag}
            isLoadingTags={isLoadingTags}
            getAvailableTagsForSelection={getAvailableTagsForSelection}
          />
        </Card>
        
        <Card className="p-4 border rounded-md flex-1">
          <TokenSection 
            selectedTokens={linkedTokens} 
            handleRemoveToken={(tokenId) => {
              const updatedTokens = linkedTokens.filter(token => token.id !== tokenId);
              onTokensChange(updatedTokens);
            }}
            handleTokenSelect={handleTokenSelect}
            isLoadingTokens={isLoadingTokens}
          />
        </Card>
      </div>
      
      <Card className="p-0 border rounded-md overflow-hidden">
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
            />
            
            <EditorContent 
              editorRef={editorRef}
              handleContentChange={handleContentChange}
              initialContent={content}
              onAutoSave={handleAutoSave}
              autoSaveDelay={2000}
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
              noteId={noteId || ""}
              attachmentUrl={attachment_url}
              onAttachmentChange={onAttachmentChange}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

// Helper function to create an HTML table
const createTable = (rows: number, cols: number) => {
  let tableHTML = '<table class="border-collapse w-full my-4">';
  
  // Table header
  tableHTML += '<thead>';
  tableHTML += '<tr>';
  for (let i = 0; i < cols; i++) {
    tableHTML += '<th class="border border-gray-300 px-4 py-2 bg-gray-100">Header ' + (i + 1) + '</th>';
  }
  tableHTML += '</tr>';
  tableHTML += '</thead>';
  
  // Table body
  tableHTML += '<tbody>';
  for (let i = 0; i < rows - 1; i++) {
    tableHTML += '<tr>';
    for (let j = 0; j < cols; j++) {
      tableHTML += '<td class="border border-gray-300 px-4 py-2">Cell ' + (i + 1) + '-' + (j + 1) + '</td>';
    }
    tableHTML += '</tr>';
  }
  tableHTML += '</tbody>';
  
  tableHTML += '</table>';
  return tableHTML;
};

export default RichTextEditor;
