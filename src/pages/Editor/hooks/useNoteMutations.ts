
import { useState } from "react";
import { Note, TradeInfo, Tag, Token } from "@/types";
import { toast } from "sonner";
import { linkTagToNote, unlinkTagFromNote } from "@/services/tag";
import { linkTokenToNote, unlinkTokenFromNote } from "@/services/tokenService";

interface UseNoteMutationsProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
}

export const useNoteMutations = ({ currentNote, onSave }: UseNoteMutationsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<Note>>({});
  const [localTitle, setLocalTitle] = useState(currentNote.title);
  const [localCategory, setLocalCategory] = useState(currentNote.category || "General");
  const [linkedTags, setLinkedTags] = useState<Tag[]>([]);
  const [localTradeInfo, setLocalTradeInfo] = useState<TradeInfo | undefined>(currentNote.tradeInfo);
  const [hasConclusion, setHasConclusion] = useState<boolean>(currentNote.hasConclusion !== false);
  const [summaryState, setSummaryState] = useState<string>(currentNote.summary || "");
  const [attachments, setAttachments] = useState<string[]>(
    currentNote.attachments || 
    (currentNote.attachment_url ? [currentNote.attachment_url] : [])
  );
  
  // Handle title change
  const handleTitleChange = (title: string) => {
    console.log("NoteEditor: Title changing to:", title);
    setLocalTitle(title);
    setPendingChanges(prev => ({ ...prev, title }));
  };

  // Handle content change
  const handleContentChange = (content: string) => {
    setPendingChanges({ ...pendingChanges, content });
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    console.log("NoteEditor: Category changing to:", category);
    setLocalCategory(category);
    setPendingChanges({ ...pendingChanges, category });
    
    // Trigger immediate save when category changes
    const updatedChanges = { ...pendingChanges, category };
    handleSaveWithChanges(updatedChanges, true);
  };

  // Handle summary generation
  const handleSummaryGenerated = (summary: string, detectedHasConclusion?: boolean) => {
    console.log("Summary generated:", summary);
    console.log("Has conclusion:", detectedHasConclusion);
    
    // Update local state with the new summary
    setSummaryState(summary);
    
    // Update local state with conclusion status if provided
    if (detectedHasConclusion !== undefined) {
      setHasConclusion(detectedHasConclusion);
      setPendingChanges({ 
        ...pendingChanges, 
        summary,
        hasConclusion: detectedHasConclusion 
      });
    } else {
      setPendingChanges({ ...pendingChanges, summary });
    }
    
    // Trigger immediate save when summary is generated to ensure it's not lost
    const updatedChanges = detectedHasConclusion !== undefined 
      ? { ...pendingChanges, summary, hasConclusion: detectedHasConclusion }
      : { ...pendingChanges, summary };
    
    handleSaveWithChanges(updatedChanges, false);
  };

  // Handle trade info changes
  const handleTradeInfoChange = (tradeInfo: TradeInfo) => {
    console.log("Trade info changed:", tradeInfo);
    setLocalTradeInfo(tradeInfo);
    setPendingChanges({ ...pendingChanges, tradeInfo });
    
    // Trigger immediate save when trade info changes
    const updatedChanges = { ...pendingChanges, tradeInfo };
    handleSaveWithChanges(updatedChanges, true);
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
    console.log("Tokens changed in NoteEditor:", tokens);
    
    if (currentNote.id && !currentNote.id.startsWith('temp-')) {
      const currentTokenIds = currentNote.tokens?.map(token => token.id) || [];
      const newTokenIds = tokens.map(token => token.id);
      
      console.log("Current token IDs:", currentTokenIds);
      console.log("New token IDs:", newTokenIds);
      
      // Find tokens to add (in newTokenIds but not in currentTokenIds)
      const tokensToAdd = newTokenIds.filter(id => !currentTokenIds.includes(id));
      
      // Find tokens to remove (in currentTokenIds but not in newTokenIds)
      const tokensToRemove = currentTokenIds.filter(id => !newTokenIds.includes(id));
      
      console.log("Tokens to add:", tokensToAdd);
      console.log("Tokens to remove:", tokensToRemove);
      
      // Link new tokens
      for (const tokenId of tokensToAdd) {
        try {
          console.log(`Linking token ${tokenId} to note ${currentNote.id}`);
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
          console.log(`Unlinking token ${tokenId} from note ${currentNote.id}`);
          const success = await unlinkTokenFromNote(currentNote.id, tokenId);
          if (!success) {
            toast.error(`Failed to unlink token: ${tokenId}`);
          }
        } catch (error) {
          console.error(`Error unlinking token ${tokenId}:`, error);
        }
      }
    }
    
    // Ensure the tokens are saved 
    setPendingChanges(prev => ({ ...prev }));
    
    // Force a save to ensure tokens are saved
    if (tokens.length > 0) {
      handleManualSave();
    }
  };

  // Handle attachment changes
  const handleAttachmentChange = (url: string | null) => {
    // Update the attachment_url for backward compatibility
    setPendingChanges({ ...pendingChanges, attachment_url: url || undefined });
    
    // Update the attachments array
    if (url) {
      // If we're adding a URL that's not already in the attachments array
      if (!attachments.includes(url)) {
        const newAttachments = [...attachments, url];
        setAttachments(newAttachments);
        setPendingChanges({ 
          ...pendingChanges, 
          attachment_url: url, 
          attachments: newAttachments 
        });
      }
    } else {
      // If we're removing all attachments
      setAttachments([]);
      setPendingChanges({ 
        ...pendingChanges, 
        attachment_url: undefined, 
        attachments: [] 
      });
    }
  };

  // Save function with specific changes
  const handleSaveWithChanges = async (changes: Partial<Note>, isAutoSave = false) => {
    setIsSaving(true);
    
    try {
      // Always include summary in the changes to prevent it from being lost
      const updatedChanges = {
        ...changes,
        summary: changes.summary !== undefined ? changes.summary : summaryState,
        attachments: attachments
      };
      
      console.log("Saving changes:", updatedChanges);
      await onSave(updatedChanges);
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

  // Manual save function to handle immediate saves
  const handleManualSave = async () => {
    // Always include the summary in the save
    const updatedChanges = {
      ...pendingChanges,
      summary: pendingChanges.summary !== undefined ? pendingChanges.summary : summaryState,
      attachments: attachments
    };
    
    await handleSaveWithChanges(updatedChanges, false);
  };

  return {
    isSaving,
    pendingChanges,
    localTitle,
    localCategory,
    linkedTags,
    localTradeInfo,
    hasConclusion,
    summaryState,
    attachments,
    handleTitleChange,
    handleContentChange,
    handleCategoryChange,
    handleSummaryGenerated,
    handleTradeInfoChange,
    handleTagsChange,
    handleTokensChange,
    handleAttachmentChange,
    handleSaveWithChanges,
    handleManualSave
  };
};
