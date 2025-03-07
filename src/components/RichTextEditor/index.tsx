
import React from "react";
import { Note, Token } from "@/types";
import { useEditor } from "./hooks/useEditor";
import EditorHeader from "./EditorHeader";
import AttachmentSection from "./AttachmentSection";
import TokenSection from "./TokenSection";
import TagsSection from "./TagsSection";
import FormattingToolbar from "./FormattingToolbar";
import EditorContent from "./EditorContent";

interface RichTextEditorProps {
  note?: Note;
  onSave?: (note: Note) => Promise<Note | null>;
  categories?: string[];
  linkedTokens?: Token[];
}

const RichTextEditor = ({ 
  note, 
  onSave, 
  categories = [], 
  linkedTokens = [] 
}: RichTextEditorProps) => {
  const editor = useEditor(note, onSave, linkedTokens);
  
  // Ensure we have at least the General category
  const allCategories = ["General", ...categories.filter(c => c !== "General")];

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Editor Header */}
      <div className="mb-4 space-y-4">
        <EditorHeader
          title={editor.title}
          setTitle={editor.setTitle}
          summary={editor.summary}
          isGeneratingSummary={editor.isGeneratingSummary}
          generateSummary={editor.generateSummary}
          category={editor.category}
          handleCategorySelect={editor.handleCategorySelect}
          allCategories={allCategories}
          lastSaved={editor.lastSaved}
          handleSave={editor.handleSave}
          isUploading={editor.isUploading}
        />
        
        {/* File Attachment Section */}
        <AttachmentSection
          attachmentFile={editor.attachmentFile}
          attachmentUrl={editor.attachmentUrl}
          handleAttachFileClick={editor.handleAttachFileClick}
          handleRemoveAttachment={editor.handleRemoveAttachment}
          setAttachmentFile={editor.setAttachmentFile}
          fileInputRef={editor.fileInputRef}
          handleFileChange={editor.handleFileChange}
          getFilenameFromUrl={editor.getFilenameFromUrl}
        />
        
        {/* Token Selection */}
        <TokenSection
          selectedTokens={editor.selectedTokens}
          tokens={editor.tokens}
          isLoadingTokens={editor.isLoadingTokens}
          handleTokenSelect={editor.handleTokenSelect}
          handleRemoveToken={editor.handleRemoveToken}
        />
        
        {/* Tag Input */}
        <TagsSection
          linkedTags={editor.linkedTags}
          tagInput={editor.tagInput}
          setTagInput={editor.setTagInput}
          handleAddTag={editor.handleAddTag}
          handleRemoveTag={editor.handleRemoveTag}
          handleSelectTag={editor.handleSelectTag}
          isLoadingTags={editor.isLoadingTags}
          getAvailableTagsForSelection={editor.getAvailableTagsForSelection}
        />
      </div>
      
      {/* Formatting Toolbar */}
      <FormattingToolbar execCommand={editor.execCommand} />
      
      {/* Editable Content Area */}
      <EditorContent
        editorRef={editor.editorRef}
        content={editor.content}
        handleContentChange={editor.handleContentChange}
      />
    </div>
  );
};

export default RichTextEditor;
