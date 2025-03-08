
import React, { useState, useCallback, useEffect } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, Token, Tag } from "@/types";
import { toast } from "sonner";
import { linkTagToNote, unlinkTagFromNote } from "@/services/tagService";
import { linkTokenToNote, unlinkTokenFromNote } from "@/services/tokenService";

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
  const [autoSave, setAutoSave] = useState(false); // Changed default to false to disable autosave
  const [localTitle, setLocalTitle] = useState(currentNote.title);
  const [localCategory, setLocalCategory] = useState(currentNote.category || "General");
  const [linkedTags, setLinkedTags] = useState<Tag[]>([]);
  const [localLinkedTokens, setLocalLinkedTokens] = useState<Token[]>(linkedTokens);

  // Update local state when currentNote changes
  useEffect(() => {
    setLocalTitle(currentNote.title);
    setLocalCategory(currentNote.category || "General");
    setLocalLinkedTokens(linkedTokens);
    
    // Convert tag IDs to tag objects
    setLinkedTags(getTagObjects());
  }, [currentNote, allTags, linkedTokens]);

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

  // Handle summary generation
  const handleSummaryGenerated = (summary: string) => {
    console.log("Summary generated:", summary);
    setPendingChanges({ ...pendingChanges, summary });
    
    // Trigger immediate autosave when summary is generated
    if (autoSave) {
      const updatedChanges = { ...pendingChanges, summary };
      handleSaveWithChanges(updatedChanges, true);
    }
  };

  // Handle tag changes
  const handleTagsChange = async (tags: Tag[]) => {
    console.log("Tag changed:", tags);
    setLinkedTags(tags);
    
    if (currentNote.id && !currentNote.id.startsWith('temp-')) {
      const currentTagIds = currentNote.tags || [];
      const newTagIds = tags.map(tag => tag.id);
      
      // Find tags to add (in newTagIds but not in currentTagIds)
      const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
      
      // Find tags to remove (in currentTagIds but not in newTagIds)
      const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));
      
      // Link new tags
      for (const tagId of tagsToAdd) {
        try {
          await linkTagToNote(currentNote.id, tagId);
        } catch (error) {
          console.error(`Error linking tag ${tagId}:`, error);
        }
      }
      
      // Unlink removed tags
      for (const tagId of tagsToRemove) {
        try {
          await unlinkTagFromNote(currentNote.id, tagId);
        } catch (error) {
          console.error(`Error unlinking tag ${tagId}:`, error);
        }
      }
    }
    
    // Update pending changes with the new tag IDs
    setPendingChanges({ ...pendingChanges, tags: tags.map(tag => tag.id) });
  };

  // Handle token changes
  const handleTokensChange = async (tokens: Token[]) => {
    console.log("Tokens changed:", tokens);
    setLocalLinkedTokens(tokens);
    
    if (currentNote.id && !currentNote.id.startsWith('temp-')) {
      const currentTokenIds = linkedTokens.map(token => token.id);
      const newTokenIds = tokens.map(token => token.id);
      
      // Find tokens to add (in newTokenIds but not in currentTokenIds)
      const tokensToAdd = newTokenIds.filter(id => !currentTokenIds.includes(id));
      
      // Find tokens to remove (in currentTokenIds but not in newTokenIds)
      const tokensToRemove = currentTokenIds.filter(id => !newTokenIds.includes(id));
      
      // Link new tokens
      for (const tokenId of tokensToAdd) {
        try {
          const success = await linkTokenToNote(currentNote.id, tokenId);
          if (!success) {
            toast.error(`Failed to link token: ${tokenId}`);
          }
        } catch (error) {
          console.error(`Error linking token ${tokenId}:`, error);
        }
      }
      
      // Unlink removed tokens
      for (const tokenId of tokensToRemove) {
        try {
          const success = await unlinkTokenFromNote(currentNote.id, tokenId);
          if (!success) {
            toast.error(`Failed to unlink token: ${tokenId}`);
          }
        } catch (error) {
          console.error(`Error unlinking token ${tokenId}:`, error);
        }
      }
    }
    
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
    if (!currentNote.tags || !Array.isArray(currentNote.tags)) {
      return [];
    }
    
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
        linkedTags={linkedTags}
        onTagsChange={handleTagsChange}
        linkedTokens={localLinkedTokens}
        onTokensChange={handleTokensChange}
        noteId={currentNote.id}
        attachment_url={currentNote.attachment_url}
        onAttachmentChange={handleAttachmentChange}
        onSave={handleAutoSave}
        autoSave={autoSave}
        isSaving={isSaving}
        manualSave={() => saveChanges(false)}
        summary={currentNote.summary}
        onSummaryGenerated={handleSummaryGenerated}
      />
    </div>
  );
};

export default NoteEditor;
