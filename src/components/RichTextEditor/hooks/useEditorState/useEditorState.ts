
import { useState, useCallback } from "react";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTags } from "./useTags";
import { useAutoSave } from "./useAutoSave";
import { fetchTags } from "@/services/tag";

export function useEditorState({
  initialContent,
  initialTitle,
  initialTags,
  initialTokens = [],
  initialCategory,
  onSave,
  autoSave = false,
  onContentChange,
  onTitleChange,
  onTagsChange,
  onTokensChange = () => {},
  onCategoryChange,
  onSummaryGenerated,
  onTradeInfoChange = () => {},
  availableTagsForSelection,
}: {
  initialContent: string;
  initialTitle: string;
  initialTags: Tag[];
  initialTokens?: Token[];
  initialCategory: string;
  onSave?: () => void;
  autoSave?: boolean;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: Tag[]) => void;
  onTokensChange?: (tokens: Token[]) => void;
  onCategoryChange: (category: string) => void;
  onSummaryGenerated?: (summary: string, hasConclusion?: boolean) => void;
  onTradeInfoChange?: (tradeInfo: TradeInfo) => void;
  availableTagsForSelection?: Tag[];
}) {
  const [currentContent, setCurrentContent] = useState(initialContent);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);

  // Use the custom hooks
  const {
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
    getAvailableTagsForSelection,
    isLoadingTags,
    fetchedTags
  } = useTags({
    initialTags,
    initialCategory,
    onTagsChange,
    availableTagsForSelection
  });

  const {
    lastSaved,
    setLastSaved,
    handleAutoSave,
    handleManualSave
  } = useAutoSave({ autoSave, onSave });

  // Content handling
  const handleContentUpdate = useCallback((newContent: string) => {
    setCurrentContent(newContent);
  }, []);

  const handleContentChange = () => {
    onContentChange(currentContent);
  };

  // Title handling - Improved to properly manage state and invoke callbacks
  const handleTitleChange = useCallback((newTitle: string) => {
    console.log("useEditorState: Title change triggered with:", newTitle);
    
    // Update local state
    setCurrentTitle(newTitle);
    
    // Directly invoke the onTitleChange callback function with the new title
    onTitleChange(newTitle);
    
    // Auto-save if enabled
    if (autoSave && onSave) {
      setTimeout(() => {
        onSave();
        setLastSaved(new Date());
      }, 500);
    }
  }, [autoSave, onSave, onTitleChange, setLastSaved]);

  return {
    tagInput,
    setTagInput,
    lastSaved,
    setLastSaved,
    currentContent,
    currentTitle,
    handleContentUpdate,
    handleAutoSave,
    handleManualSave,
    handleContentChange,
    handleTitleChange,
    handleAddTag,
    handleRemoveTag,
    handleSelectTag,
    getAvailableTagsForSelection,
    isLoadingTags,
    fetchedTags
  };
}
