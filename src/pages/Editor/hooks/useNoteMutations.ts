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
  
  const handleTitleChange = (title: string) => {
    console.log("NoteEditor: Title changing to:", title);
    setLocalTitle(title);
    setPendingChanges(prev => ({ ...prev, title }));
  };

  const handleContentChange = (content: string) => {
    setPendingChanges({ ...pendingChanges, content });
  };

  const handleCategoryChange = (category: string) => {
    console.log("NoteEditor: Category changing to:", category);
    setLocalCategory(category);
    setPendingChanges({ ...pendingChanges, category });
    
    const updatedChanges = { ...pendingChanges, category };
    handleSaveWithChanges(updatedChanges, true);
  };

  const handleSummaryGenerated = (summary: string, detectedHasConclusion?: boolean) => {
    console.log("Summary generated:", summary);
    console.log("Has conclusion:", detectedHasConclusion);
    
    setSummaryState(summary);
    
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
    
    const updatedChanges = detectedHasConclusion !== undefined 
      ? { ...pendingChanges, summary, hasConclusion: detectedHasConclusion }
      : { ...pendingChanges, summary };
    
    handleSaveWithChanges(updatedChanges, false);
  };

  const handleTradeInfoChange = (tradeInfo: TradeInfo) => {
    console.log("Trade info changed:", tradeInfo);
    setLocalTradeInfo(tradeInfo);
    setPendingChanges({ ...pendingChanges, tradeInfo });
    
    const updatedChanges = { ...pendingChanges, tradeInfo };
    handleSaveWithChanges(updatedChanges, true);
  };

  const handleTagsChange = async (tags: Tag[]) => {
    console.log("Tag changed:", tags);
    setLinkedTags(tags);
    
    if (currentNote.id && !currentNote.id.startsWith('temp-')) {
      const currentTagIds = currentNote.tags || [];
      const newTagIds = tags.map(tag => tag.id);
      
      const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));
      
      for (const tagId of tagsToAdd) {
        try {
          await linkTagToNote(currentNote.id, tagId);
        } catch (error) {
          console.error(`Error linking tag ${tagId}:`, error);
        }
      }
      
      for (const tagId of tagsToRemove) {
        try {
          await unlinkTagFromNote(currentNote.id, tagId);
        } catch (error) {
          console.error(`Error unlinking tag ${tagId}:`, error);
        }
      }
    }
    
    setPendingChanges({ ...pendingChanges, tags: tags.map(tag => tag.id) });
  };

  const handleTokensChange = async (tokens: Token[]) => {
    console.log("Tokens changed in NoteEditor:", tokens);
    
    if (currentNote.id && !currentNote.id.startsWith('temp-')) {
      const currentTokenIds = currentNote.tokens?.map(token => token.id) || [];
      const newTokenIds = tokens.map(token => token.id);
      
      console.log("Current token IDs:", currentTokenIds);
      console.log("New token IDs:", newTokenIds);
      
      const tokensToAdd = newTokenIds.filter(id => !currentTokenIds.includes(id));
      const tokensToRemove = currentTokenIds.filter(id => !newTokenIds.includes(id));
      
      console.log("Tokens to add:", tokensToAdd);
      console.log("Tokens to remove:", tokensToRemove);
      
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
    
    setPendingChanges(prev => ({ ...prev }));
    
    if (tokens.length > 0) {
      handleManualSave();
    }
  };

  const handleAttachmentChange = (url: string | null) => {
    if (url) {
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
      setAttachments([]);
      setPendingChanges({ 
        ...pendingChanges, 
        attachment_url: undefined, 
        attachments: [] 
      });
    }
  };

  const handleSaveWithChanges = async (changes: Partial<Note>, isAutoSave = false) => {
    setIsSaving(true);
    
    try {
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

  const handleManualSave = async () => {
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
