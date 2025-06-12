
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import EditorHeader from "../EditorHeader";
import EditorStatusBar from "../EditorStatusBar";
import EditorTabs from "../EditorTabs";
import MetadataSection from "../MetadataSection";
import SpecialSections from "../SpecialSections";
import PrintModal from "../PrintModal";
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
  attachments?: string[];
  onAttachmentChange?: (url: string | null) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  handleManualSave: () => void;
  summary?: string;
  onSummaryGenerated?: (summary: string, hasConclusion?: boolean) => void;
  tradeInfo?: TradeInfo;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
  hasConclusion?: boolean;
  onPrint?: () => void;
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
  attachments = [],
  onAttachmentChange = () => {},
  category,
  onCategoryChange,
  isSaving,
  lastSaved,
  handleManualSave,
  summary = "",
  onSummaryGenerated,
  tradeInfo,
  onTradeInfoChange = () => {},
  hasConclusion = true,
  onPrint,
}) => {
  const isTradingCategory = category === "Trading" || category === "Pair Trading";
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  const handlePrintAction = () => {
    if (onPrint) {
      onPrint();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-100px)] overflow-hidden">
      <EditorHeader 
        title={title} 
        onTitleChange={onTitleChange}
        category={category}
        onCategoryChange={onCategoryChange}
        isPrintMode={false}
        onPrint={handlePrintAction}
      />
      
      <EditorStatusBar 
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleManualSave}
        onPrint={handlePrintAction}
      />
      
      <div className="flex flex-col overflow-hidden flex-1 relative">
        <div className="overflow-y-auto flex-1">
          <div className="space-y-1">
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
            
            <Card className="p-0 border rounded-md overflow-hidden flex-1 min-h-0 flex flex-col">
              <EditorTabs 
                content={content}
                onContentChange={onContentChange}
                onContentUpdate={handleContentUpdate}
                noteId={noteId}
                attachment_url={attachment_url}
                attachments={attachments}
                onAttachmentChange={onAttachmentChange}
                hasConclusion={hasConclusion}
                category={category}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        content={currentContent}
        title={title}
        category={category}
        summary={summary}
        attachmentUrl={attachment_url}
      />
    </div>
  );
};

export default EditorMain;
