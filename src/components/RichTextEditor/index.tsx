
import { useState } from "react";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { useEditorState } from "./hooks/useEditorState";
import { useTokenHandling } from "./hooks/useTokenHandling";
import EditorMain from "./components/EditorMain";
import { printNote } from "@/utils/printUtils";

interface RichTextEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  linkedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  linkedTokens?: Token[];
  onTokensChange?: (tokens: Token[]) => void;
  noteId?: string;
  attachment_url?: string;
  attachments?: string[];
  onAttachmentChange?: (url: string | null) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  onSave?: () => void; 
  autoSave?: boolean;
  isSaving?: boolean;
  manualSave?: () => void;
  summary?: string;
  onSummaryGenerated?: (summary: string, hasConclusion?: boolean) => void;
  tradeInfo?: TradeInfo;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
  hasConclusion?: boolean;
  availableTagsForSelection?: Tag[];
}

const RichTextEditor = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  linkedTags,
  onTagsChange,
  linkedTokens = [],
  onTokensChange = () => {},
  noteId = "",
  attachment_url,
  attachments = [],
  onAttachmentChange = () => {},
  category,
  onCategoryChange,
  onSave,
  autoSave = false,
  isSaving = false,
  manualSave,
  summary = "",
  onSummaryGenerated,
  tradeInfo,
  onTradeInfoChange = () => {},
  hasConclusion = true,
  availableTagsForSelection,
}: RichTextEditorProps) => {
  
  // Handle direct print for current note
  const handlePrint = () => {
    printNote({
      id: noteId,
      title: title || "Untitled Note",
      content: currentContent,
      category: category || "General",
      tags: linkedTags.map(tag => typeof tag === 'string' ? tag : tag.id), // Convert Tag objects to tag IDs
      summary: summary,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachment_url: attachment_url,
      attachments: attachments,
      tradeInfo: tradeInfo
    });
  };
  
  // Use custom hooks to manage editor state and token handling
  const {
    tagInput,
    setTagInput,
    lastSaved,
    currentContent,
    handleContentUpdate,
    handleAutoSave,
    handleManualSave,
    handleContentChange,
    handleTitleChange,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
    getAvailableTagsForSelection,
    isLoadingTags
  } = useEditorState({
    initialContent: content,
    initialTitle: title,
    initialTags: linkedTags,
    initialTokens: linkedTokens,
    initialCategory: category,
    onSave,
    autoSave,
    onContentChange,
    onTitleChange,
    onTagsChange,
    onTokensChange,
    onCategoryChange,
    onSummaryGenerated,
    onTradeInfoChange,
    availableTagsForSelection
  });

  const {
    availableTokens,
    isLoadingTokens,
    handleTokenSelect,
    handleRemoveToken
  } = useTokenHandling(linkedTokens, onTokensChange);
  
  // Improved title change handler to ensure it properly updates the parent component
  const handleEditorTitleChange = (newTitle: string) => {
    console.log("RichTextEditor: Title change detected:", newTitle);
    // Make sure we call the hook's handleTitleChange which will in turn call onTitleChange
    handleTitleChange(newTitle);
  };

  return (
    <EditorMain
      title={title}
      content={content}
      onTitleChange={handleEditorTitleChange}
      onContentChange={handleContentChange}
      handleContentUpdate={handleContentUpdate}
      currentContent={currentContent}
      linkedTags={linkedTags}
      tagInput={tagInput}
      setTagInput={setTagInput}
      handleAddTag={handleAddTag}
      handleRemoveTag={handleRemoveTag}
      handleSelectTag={handleSelectTag}
      getAvailableTagsForSelection={getAvailableTagsForSelection}
      isLoadingTags={isLoadingTags}
      linkedTokens={linkedTokens}
      handleTokenSelect={handleTokenSelect}
      handleRemoveToken={handleRemoveToken}
      availableTokens={availableTokens}
      isLoadingTokens={isLoadingTokens}
      noteId={noteId}
      attachment_url={attachment_url}
      attachments={attachments}
      onAttachmentChange={onAttachmentChange}
      category={category}
      onCategoryChange={onCategoryChange}
      isSaving={isSaving}
      lastSaved={lastSaved}
      handleManualSave={manualSave || handleManualSave}
      handleAutoSave={handleAutoSave}
      summary={summary}
      onSummaryGenerated={onSummaryGenerated}
      tradeInfo={tradeInfo}
      onTradeInfoChange={onTradeInfoChange}
      hasConclusion={hasConclusion}
      onPrint={handlePrint}
    />
  );
};

export default RichTextEditor;
