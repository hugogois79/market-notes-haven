
import { useState } from "react";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { useEditorState } from "./hooks/useEditorState";
import { useTokenHandling } from "./hooks/useTokenHandling";
import EditorMain from "./components/EditorMain";
import { printNote, printNoteWithAttachments } from "@/utils/printUtils";

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
  
  // Use custom hooks to manage editor state and token handling
  const {
    tagInput,
    setTagInput,
    lastSaved,
    currentContent,
    currentTitle,
    handleContentUpdate,
    handleContentChange,
    handleTitleChange,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
    getAvailableTagsForSelection,
    isLoadingTags,
    handleManualSave
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
  
  // Handle direct print for current note
  const handlePrint = () => {
    printNote({
      id: noteId,
      title: currentTitle || title || "Untitled Note",
      content: currentContent || content,
      category: category || "General",
      tags: linkedTags.map(tag => typeof tag === 'string' ? tag : tag.id),
      summary: summary,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachment_url: attachment_url,
      attachments: attachments,
      tradeInfo: tradeInfo
    });
  };

  // Handle print with attachments
  const handlePrintWithAttachments = async () => {
    console.log("handlePrintWithAttachments called", { attachmentsCount: attachments.length });
    try {
      await printNoteWithAttachments(
        {
          id: noteId,
          title: currentTitle || title || "Untitled Note",
          content: currentContent || content,
          category: category || "General",
          tags: linkedTags.map(tag => typeof tag === 'string' ? tag : tag.id),
          summary: summary,
          createdAt: new Date(),
          updatedAt: new Date(),
          attachment_url: attachment_url,
          tradeInfo: tradeInfo
        },
        attachments
      );
    } catch (error) {
      console.error("handlePrintWithAttachments error:", error);
    }
  };

  return (
    <EditorMain
      title={currentTitle || title}
      content={content}
      onTitleChange={handleTitleChange}
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
      noteId={noteId}
      attachment_url={attachment_url}
      attachments={attachments}
      onAttachmentChange={onAttachmentChange}
      category={category}
      onCategoryChange={onCategoryChange}
      isSaving={isSaving}
      lastSaved={lastSaved}
      handleManualSave={manualSave || handleManualSave}
      summary={summary}
      onSummaryGenerated={onSummaryGenerated}
      tradeInfo={tradeInfo}
      onTradeInfoChange={onTradeInfoChange}
      hasConclusion={hasConclusion}
      onPrint={handlePrint}
      onPrintWithAttachments={handlePrintWithAttachments}
    />
  );
};

export default RichTextEditor;
