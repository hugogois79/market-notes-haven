
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
  } = useSaveNote({ onSave });

  // Override title change to ensure it's saved immediately
  const handleTitleChangeAndSave = (title: string) => {
    handleTitleChange(title);
    handleTitleChangeInSave(title);
    // Immediately save title changes
    handleSaveWithChanges({ title }, false);
  };

  // Override tags change to ensure they're saved immediately
  const handleTagsChangeAndSave = (tags: Tag[] | string[]) => {
    handleTagsChange(tags);
    
    // Process tags to match format expected by API
    const processedTags = tags.map(tag => 
      typeof tag === 'string' ? tag : tag.name || tag.id || String(tag)
    );
    
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
    handleCategoryChange,
    handleSummaryGenerated,
    handleTradeInfoChange,
    handleAttachmentChange: handleAttachmentChangeAndSave,
    handleSaveWithChanges,
    handleManualSave,
    handleTagsChange: handleTagsChangeAndSave,
    handleTokensChange
  };
};
