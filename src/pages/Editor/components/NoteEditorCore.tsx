
import React from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, Tag, Token, TradeInfo } from "@/types";

interface NoteEditorCoreProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
  linkedTokens: Token[];
  linkedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onTokensChange: (tokens: Token[]) => void;
  isSaving: boolean;
  handleManualSave: () => Promise<void>;
  localTitle: string;
  localCategory: string;
  localTradeInfo?: TradeInfo;
  hasConclusion: boolean;
  summaryState: string;
  availableTags: Tag[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onCategoryChange: (category: string) => void;
  onAttachmentChange: (url: string | null) => void;
  onSummaryGenerated: (summary: string, detectedHasConclusion?: boolean) => void;
  onTradeInfoChange: (tradeInfo: TradeInfo) => void;
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
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onAttachmentChange,
  onSummaryGenerated,
  onTradeInfoChange,
}) => {
  return (
    <div className="flex-1">
      <RichTextEditor 
        title={localTitle}
        content={currentNote.content}
        category={localCategory}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onCategoryChange={onCategoryChange}
        linkedTags={linkedTags}
        onTagsChange={onTagsChange}
        linkedTokens={linkedTokens}
        onTokensChange={onTokensChange}
        noteId={currentNote.id}
        attachment_url={currentNote.attachment_url}
        onAttachmentChange={onAttachmentChange}
        onSave={async () => await onSave({})} // Empty save for auto-save
        autoSave={false} // Keep auto-save disabled
        isSaving={isSaving}
        manualSave={handleManualSave}
        summary={summaryState} 
        onSummaryGenerated={onSummaryGenerated}
        tradeInfo={localTradeInfo}
        onTradeInfoChange={onTradeInfoChange}
        hasConclusion={hasConclusion}
        availableTagsForSelection={availableTags}
      />
    </div>
  );
};

export default NoteEditorCore;
