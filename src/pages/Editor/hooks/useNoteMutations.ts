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
      // Ensure the tag objects have the required properties
      // Make sure 'tag' is treated as an object before using spread operator
      return {
        id: typeof tag === 'object' && tag !== null ? tag.id : '',
        name: typeof tag === 'object' && tag !== null ? tag.name : '',
        category: typeof tag === 'object' && tag !== null ? tag.category : null,
        categories: []
      };
    }) as Tag[] || []
  });

  const {
    isSaving,
    pendingChanges,
    handleSaveWithChanges,
    handleManualSave,
    handleContentChange
  } = useSaveNote({ onSave });

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
    handleTitleChange,
    handleContentChange,
    handleCategoryChange,
    handleSummaryGenerated,
    handleTradeInfoChange,
    handleAttachmentChange,
    handleSaveWithChanges,
    handleManualSave,
    handleTagsChange,
    handleTokensChange
  };
};
