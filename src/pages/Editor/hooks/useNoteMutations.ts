
import { Note, Tag, Token, TradeInfo } from "@/types";
import { useAttachments } from "./noteMutations/useAttachments";
import { useBasicNoteFields } from "./noteMutations/useBasicNoteFields";
import { useSaveNote } from "./noteMutations/useSaveNote";

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

    // Handlers
    handleTitleChange,
    handleContentChange,
    handleCategoryChange,
    handleSummaryGenerated,
    handleTradeInfoChange,
    handleAttachmentChange,
    handleSaveWithChanges,
    handleManualSave
  };
};
