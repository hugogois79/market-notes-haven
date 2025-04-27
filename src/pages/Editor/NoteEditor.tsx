
import React, { useEffect } from "react";
import { Note, Tag, Token } from "@/types";
import { useNoteMutations } from "./hooks/useNoteMutations";
import NoteEditorCore from "./components/NoteEditorCore";

interface NoteEditorProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
  linkedTokens: Token[];
  allTags: Tag[];
  getTagsFilteredByCategory?: (category: string | null) => Tag[];
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  currentNote, 
  onSave, 
  linkedTokens,
  allTags,
  getTagsFilteredByCategory
}) => {
  const {
    isSaving,
    localTitle,
    localCategory,
    linkedTags,
    localTradeInfo,
    hasConclusion,
    summaryState,
    handleTitleChange,
    handleContentChange,
    handleCategoryChange,
    handleSummaryGenerated,
    handleTradeInfoChange,
    handleTagsChange,
    handleTokensChange,
    handleAttachmentChange,
    handleManualSave,
    attachments
  } = useNoteMutations({ currentNote, onSave });

  const [availableTags, setAvailableTags] = React.useState<Tag[]>(allTags);

  // Update local state when currentNote changes
  useEffect(() => {
    // Update available tags based on category
    if (getTagsFilteredByCategory) {
      const filteredTags = getTagsFilteredByCategory(currentNote.category || null);
      setAvailableTags(filteredTags);
    } else {
      setAvailableTags(allTags);
    }
  }, [currentNote, allTags, getTagsFilteredByCategory]);

  return (
    <NoteEditorCore
      currentNote={currentNote}
      onSave={onSave}
      linkedTokens={linkedTokens}
      linkedTags={linkedTags}
      onTagsChange={handleTagsChange}
      onTokensChange={handleTokensChange}
      isSaving={isSaving}
      handleManualSave={handleManualSave}
      localTitle={localTitle}
      localCategory={localCategory}
      localTradeInfo={localTradeInfo}
      hasConclusion={hasConclusion}
      summaryState={summaryState}
      availableTags={availableTags}
      attachments={attachments}
      onTitleChange={handleTitleChange}
      onContentChange={handleContentChange}
      onCategoryChange={handleCategoryChange}
      onAttachmentChange={handleAttachmentChange}
      onSummaryGenerated={handleSummaryGenerated}
      onTradeInfoChange={handleTradeInfoChange}
    />
  );
};

export default NoteEditor;
