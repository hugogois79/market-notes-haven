
import { Note, Tag, Token, TradeInfo } from "@/types";
import { useAttachments } from "./noteMutations/useAttachments";
import { useBasicNoteFields } from "./noteMutations/useBasicNoteFields";
import { useSaveNote } from "./noteMutations/useSaveNote";
import { useTagsAndTokens } from "./noteMutations/useTagsAndTokens";

interface UseNoteMutationsProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
}

export const useNoteMutations = ({ currentNote, onSave }: UseNoteMutationsProps) => {
  const { attachments, handleAttachmentChange } = useAttachments(currentNote);
  
  const {
    localTitle,
    localCategory,
    localTradeInfo,
    hasConclusion,
    summaryState,
    handleTitleChange,
    handleCategoryChange,
    handleTradeInfoChange,
    handleSummaryGenerated
  } = useBasicNoteFields(currentNote);

  const {
    linkedTags,
    linkedTokens,
    handleTagsChange,
    handleTokensChange
  } = useTagsAndTokens({
    noteId: currentNote.id,
    initialTags: currentNote.tags?.map(tag => {
      // Handle both string and Tag object formats
      if (typeof tag === 'string') {
        return { id: tag, name: tag, category: null, categories: [] };
      }
      // Explicitly cast tag as any to allow property access
      const tagObj = tag as any;
      // Ensure the tag objects have the required properties
      return {
        id: tagObj?.id || '',
        name: tagObj?.name || '',
        category: tagObj?.category || null,
        categories: []
      };
    }) as Tag[] || []
  });

  const {
    isSaving,
    pendingChanges,
    handleSaveWithChanges,
    handleManualSave,
    handleContentChange,
    handleTitleChange: handleTitleChangeInSave
  } = useSaveNote({ 
    onSave: async (updatedFields) => {
      console.log("useNoteMutations: Saving fields to database:", updatedFields);
      return onSave(updatedFields);
    }
  });

  // Title change handler to ensure it's saved immediately
  const handleTitleChangeAndSave = (title: string) => {
    console.log("useNoteMutations: Title change triggered:", title);
    
    // Update local state
    handleTitleChange(title);
    
    // Always save title changes immediately and directly
    handleTitleChangeInSave(title);
  };

  // CRITICAL FIX: Simplified category change handler that ensures immediate save
  const handleCategoryChangeAndSave = async (category: string) => {
    console.log("useNoteMutations: Category change triggered:", category);
    
    // Update local state first
    handleCategoryChange(category);
    
    // CRITICAL FIX: Save category changes immediately with the exact value
    console.log("useNoteMutations: Saving category immediately:", category);
    
    try {
      await handleSaveWithChanges({ category }, false);
      console.log("useNoteMutations: Category saved successfully:", category);
    } catch (error) {
      console.error("useNoteMutations: Failed to save category:", error);
      // Revert local state on error
      handleCategoryChange(currentNote.category || "General");
    }
  };

  // Override tags change to ensure they're saved immediately
  const handleTagsChangeAndSave = (tags: Tag[] | string[]) => {
    handleTagsChange(tags);
    
    // Process tags to match format expected by API - ensure we're using the correct up-to-date tag names
    const processedTags = tags.map(tag => {
      if (typeof tag === 'string') {
        return tag;
      }
      // Make sure we're using the most up-to-date tag name from the tag object
      return tag.name || tag.id || String(tag);
    });
    
    console.log("Saving tags with latest names:", processedTags);
    
    // Immediately save tag changes
    handleSaveWithChanges({ tags: processedTags }, false);
  };

  // Handle attachment change and save immediately
  const handleAttachmentChangeAndSave = (attachmentData: string | null) => {
    const result = handleAttachmentChange(attachmentData);
    if (result) {
      console.log("Saving attachment change:", result);
      // Save both attachment_url and attachments array
      handleSaveWithChanges({
        attachment_url: result.attachment_url,
        attachments: result.attachments
      }, false);
    }
  };

  return {
    // State
    isSaving,
    pendingChanges,
    localTitle,
    localCategory,
    localTradeInfo,
    hasConclusion,
    summaryState,
    attachments,
    linkedTags,
    linkedTokens,

    // Handlers
    handleTitleChange: handleTitleChangeAndSave,
    handleContentChange,
    handleCategoryChange: handleCategoryChangeAndSave,
    handleSummaryGenerated,
    handleTradeInfoChange,
    handleAttachmentChange: handleAttachmentChangeAndSave,
    handleSaveWithChanges,
    handleManualSave,
    handleTagsChange: handleTagsChangeAndSave,
    handleTokensChange
  };
};
