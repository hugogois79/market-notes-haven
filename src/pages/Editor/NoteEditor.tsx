
import React, { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, Token, Tag } from "@/types";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface NoteEditorProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
  linkedTokens: Token[];
  allTags: Tag[];
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  currentNote, 
  onSave, 
  linkedTokens,
  allTags
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<Note>>({});

  // Handle title change
  const handleTitleChange = (title: string) => {
    setPendingChanges({ ...pendingChanges, title });
  };

  // Handle content change
  const handleContentChange = (content: string) => {
    setPendingChanges({ ...pendingChanges, content });
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setPendingChanges({ ...pendingChanges, category });
  };

  // Handle tag changes
  const handleTagsChange = (tags: Tag[]) => {
    setPendingChanges({ ...pendingChanges, tags: tags.map(t => typeof t === 'string' ? t : t.id) });
  };

  // Handle token changes
  const handleTokensChange = (tokens: Token[]) => {
    setPendingChanges({ ...pendingChanges, tokens });
  };

  // Handle attachment changes
  const handleAttachmentChange = (url: string | null) => {
    setPendingChanges({ ...pendingChanges, attachment_url: url || undefined });
  };

  // Handle save button click
  const handleSaveClick = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info("No changes to save");
      return;
    }
    
    setIsSaving(true);
    
    try {
      await onSave(pendingChanges);
      setPendingChanges({});
      toast.success("Note saved successfully");
    } catch (error) {
      toast.error("Failed to save note");
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert tag IDs to tag objects
  const getTagObjects = () => {
    return currentNote.tags.map(tagId => {
      const foundTag = allTags.find(t => t.id === tagId);
      return foundTag || { id: tagId, name: tagId };
    });
  };

  return (
    <div className="flex-1">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleSaveClick} 
          disabled={isSaving || Object.keys(pendingChanges).length === 0}
          className="gap-2"
          variant="brand"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      <RichTextEditor 
        title={currentNote.title}
        content={currentNote.content}
        category={currentNote.category || "General"}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
        onCategoryChange={handleCategoryChange}
        linkedTags={getTagObjects()}
        onTagsChange={handleTagsChange}
        linkedTokens={linkedTokens}
        onTokensChange={handleTokensChange}
        noteId={currentNote.id}
        attachment_url={currentNote.attachment_url}
        onAttachmentChange={handleAttachmentChange}
      />
    </div>
  );
};

export default NoteEditor;
