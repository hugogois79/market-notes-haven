
import React, { useState, useCallback, useEffect } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, Token, Tag } from "@/types";
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
  const [autoSave, setAutoSave] = useState(true);
  const [localTitle, setLocalTitle] = useState(currentNote.title);
  const [localCategory, setLocalCategory] = useState(currentNote.category || "General");

  // Update local state when currentNote changes
  useEffect(() => {
    setLocalTitle(currentNote.title);
    setLocalCategory(currentNote.category || "General");
  }, [currentNote.title, currentNote.category]);

  // Handle title change
  const handleTitleChange = useCallback((title: string) => {
    console.log("NoteEditor: Title changing to:", title);
    setLocalTitle(title);
    setPendingChanges(prev => ({ ...prev, title }));
  }, []);

  // Handle content change
  const handleContentChange = (content: string) => {
    setPendingChanges({ ...pendingChanges, content });
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    console.log("NoteEditor: Category changing to:", category);
    setLocalCategory(category);
    setPendingChanges({ ...pendingChanges, category });
    
    // Trigger immediate autosave when category changes
    if (autoSave) {
      const updatedChanges = { ...pendingChanges, category };
      handleSaveWithChanges(updatedChanges, true);
    }
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

  // Auto-save function that can be called automatically 
  const handleAutoSave = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) {
      return; // No changes to save
    }
    
    await handleSaveWithChanges(pendingChanges, true);
  }, [pendingChanges]);

  // Save function with specific changes
  const handleSaveWithChanges = async (changes: Partial<Note>, isAutoSave = false) => {
    setIsSaving(true);
    
    try {
      console.log("Saving changes:", changes);
      await onSave(changes);
      setPendingChanges({});
      
      if (!isAutoSave) {
        toast.success("Note saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save note");
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Common save function for both manual and auto save
  const saveChanges = async (isAutoSave = false) => {
    await handleSaveWithChanges(pendingChanges, isAutoSave);
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
      <RichTextEditor 
        title={localTitle}
        content={currentNote.content}
        category={localCategory}
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
        onSave={handleAutoSave}
        autoSave={autoSave}
        isSaving={isSaving}
        manualSave={() => saveChanges(false)}
      />
    </div>
  );
};

export default NoteEditor;
