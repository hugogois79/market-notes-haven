
import React from "react";
import { Card } from "@/components/ui/card";
import EditorHeader from "../EditorHeader";
import EditorStatusBar from "../EditorStatusBar";
import EditorTabs from "../EditorTabs";
import MetadataSection from "../MetadataSection";
import SpecialSections from "../SpecialSections";
import { Tag, Token, TradeInfo } from "@/types";

interface EditorMainProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  handleContentUpdate: (content: string) => void;
  currentContent: string;
  linkedTags: Tag[];
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => Promise<void>;
  handleRemoveTag: (tagToRemove: string | Tag) => void;
  handleSelectTag: (tag: Tag) => void;
  getAvailableTagsForSelection: () => Tag[];
  isLoadingTags: boolean;
  linkedTokens: Token[];
  handleTokenSelect: (token: string | Token) => void;
  handleRemoveToken: (tokenId: string) => void;
  availableTokens: Token[];
  isLoadingTokens: boolean;
  noteId: string;
  attachment_url?: string;
  onAttachmentChange?: (url: string | null) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  handleManualSave: () => void;
  handleAutoSave: () => void;
  summary?: string;
  onSummaryGenerated?: (summary: string, hasConclusion?: boolean) => void;
  tradeInfo?: TradeInfo;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
  hasConclusion?: boolean;
}

const EditorMain: React.FC<EditorMainProps> = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  handleContentUpdate,
  currentContent,
  linkedTags,
  tagInput,
  setTagInput,
  handleAddTag,
  handleRemoveTag,
  handleSelectTag,
  getAvailableTagsForSelection,
  isLoadingTags,
  linkedTokens,
  handleTokenSelect,
  handleRemoveToken,
  availableTokens,
  isLoadingTokens,
  noteId,
  attachment_url,
  onAttachmentChange = () => {},
  category,
  onCategoryChange,
  isSaving,
  lastSaved,
  handleManualSave,
  handleAutoSave,
  summary = "",
  onSummaryGenerated,
  tradeInfo,
  onTradeInfoChange = () => {},
  hasConclusion = true,
}) => {
  const isTradingCategory = category === "Trading" || category === "Pair Trading";

  return (
    <div className="flex flex-col gap-4 mt-2">
      <EditorHeader 
        title={title} 
        onTitleChange={onTitleChange}
        category={category}
        onCategoryChange={onCategoryChange}
      />
      
      <EditorStatusBar 
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleManualSave}
      />
      
      <SpecialSections 
        noteId={noteId}
        content={currentContent}
        initialSummary={summary}
        onSummaryGenerated={onSummaryGenerated}
        isTradingCategory={isTradingCategory}
        availableTokens={availableTokens}
        isLoadingTokens={isLoadingTokens}
        tradeInfo={tradeInfo}
        onTradeInfoChange={onTradeInfoChange}
      />
      
      <MetadataSection 
        linkedTags={linkedTags}
        tagInput={tagInput}
        setTagInput={setTagInput}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        handleSelectTag={handleSelectTag}
        isLoadingTags={isLoadingTags}
        getAvailableTagsForSelection={getAvailableTagsForSelection}
        linkedTokens={linkedTokens}
        handleRemoveToken={handleRemoveToken}
        handleTokenSelect={handleTokenSelect}
        isLoadingTokens={isLoadingTokens}
        category={category}
        categoryFilter={category}
      />
      
      <Card className="p-0 border rounded-md overflow-hidden">
        <EditorTabs 
          content={content}
          onContentChange={onContentChange}
          onContentUpdate={handleContentUpdate}
          onAutoSave={handleAutoSave}
          noteId={noteId}
          attachment_url={attachment_url}
          onAttachmentChange={onAttachmentChange}
          hasConclusion={hasConclusion}
          category={category}
        />
      </Card>
    </div>
  );
};

export default EditorMain;
