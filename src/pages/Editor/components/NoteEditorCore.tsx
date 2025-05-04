import React, { useState, useCallback } from "react";
import { Note, Tag, Token, TradeInfo } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import EditorMain from "@/components/RichTextEditor/components/EditorMain";

interface NoteEditorCoreProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
  linkedTokens: Token[];
  linkedTags: Tag[];
  onTagsChange: (tags: Tag[] | string[]) => void;
  onTokensChange: (tokens: Token[]) => void;
  isSaving: boolean;
  handleManualSave: () => void;
  localTitle: string;
  localCategory: string;
  localTradeInfo?: TradeInfo;
  hasConclusion: boolean;
  summaryState: {
    summary: string;
    hasConclusion: boolean;
  };
  availableTags: Tag[];
  attachments?: string[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onCategoryChange: (category: string) => void;
  onAttachmentChange: (url: string | null) => void;
  onSummaryGenerated?: (summary: string, hasConclusion?: boolean) => void;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
}

const NoteEditorCore: React.FC<NoteEditorCoreProps> = ({
  currentNote,
  onSave,
  linkedTokens,
  linkedTags,
  onTagsChange,
  onTokensChange,
  isSaving,
  handleManualSave,
  localTitle,
  localCategory,
  localTradeInfo,
  hasConclusion,
  summaryState,
  availableTags,
  attachments = [],
  onAttachmentChange,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onSummaryGenerated,
  onTradeInfoChange,
}) => {
  const [content, setContent] = useState(currentNote.content);
  const [tagInput, setTagInput] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounce the content change handler
  const debouncedContentChange = useDebounce((value: string) => {
    setContent(value);
  }, 500);

  // Handler for updating content
  const handleContentUpdate = (value: string) => {
    debouncedContentChange(value);
  };

  // Handler for auto-saving
  const handleAutoSave = useCallback(async () => {
    if (isSaving) return;
    try {
      await onSave({ content });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error auto-saving note:", error);
    }
  }, [content, isSaving, onSave]);

  // Handler for adding a tag
  const handleAddTag = async () => {
    if (tagInput.trim() === "") return;
    const newTag = availableTags.find((tag) => tag.name === tagInput);
    if (newTag) {
      onTagsChange([...linkedTags, newTag]);
    } else {
      // If tag doesn't exist, create a new one
      onTagsChange([...linkedTags, tagInput]);
    }
    setTagInput("");
  };

  // Handler for removing a tag
  const handleRemoveTag = (tagToRemove: string | Tag) => {
    const tagIdToRemove = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id;
    const updatedTags = linkedTags.filter((tag) => tag.id !== tagIdToRemove);
    onTagsChange(updatedTags);
  };

  // Handler for selecting a tag
  const handleSelectTag = (tag: Tag) => {
    if (!linkedTags.find((linkedTag) => linkedTag.id === tag.id)) {
      onTagsChange([...linkedTags, tag]);
    }
    setTagInput("");
  };

  // Get available tags for selection
  const getAvailableTagsForSelection = () => {
    return availableTags.filter(
      (tag) => !linkedTags.find((linkedTag) => linkedTag.id === tag.id)
    );
  };

  // Handler for selecting a token
  const handleTokenSelect = (token: string | Token) => {
    const tokenId = typeof token === 'string' ? token : token.id;
    const newToken = linkedTokens.find((linkedToken) => linkedToken.id === tokenId);
    if (!newToken) {
      onTokensChange([...linkedTokens, token as Token]);
    }
  };

  // Handler for removing a token
  const handleRemoveToken = (tokenId: string) => {
    const updatedTokens = linkedTokens.filter((token) => token.id !== tokenId);
    onTokensChange(updatedTokens);
  };

  return (
    <EditorMain
      title={localTitle}
      content={content}
      onTitleChange={onTitleChange}
      handleContentUpdate={handleContentUpdate}
      onContentChange={onContentChange}
      currentContent={content}
      linkedTags={linkedTags}
      tagInput={tagInput}
      setTagInput={setTagInput}
      handleAddTag={handleAddTag}
      handleRemoveTag={handleRemoveTag}
      handleSelectTag={handleSelectTag}
      getAvailableTagsForSelection={getAvailableTagsForSelection}
      isLoadingTags={false}
      linkedTokens={linkedTokens}
      handleTokenSelect={handleTokenSelect}
      handleRemoveToken={handleRemoveToken}
      availableTokens={[]}
      isLoadingTokens={false}
      noteId={currentNote.id}
      attachment_url={currentNote.attachment_url}
      attachments={attachments}
      onAttachmentChange={onAttachmentChange}
      category={localCategory}
      onCategoryChange={onCategoryChange}
      isSaving={isSaving}
      lastSaved={lastSaved}
      handleManualSave={handleManualSave}
      summary={currentNote.summary}
      onSummaryGenerated={onSummaryGenerated}
      tradeInfo={localTradeInfo}
      onTradeInfoChange={onTradeInfoChange}
      hasConclusion={hasConclusion}
    />
  );
};

export default NoteEditorCore;
