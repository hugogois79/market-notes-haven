
import { useState, useCallback } from "react";
import { Tag, Token, Note, TradeInfo } from "@/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTags } from "./useTags";
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  // Content handling
  const handleContentUpdate = useCallback((newContent: string) => {
    setCurrentContent(newContent);
  }, []);

  const handleContentChange = () => {
    onContentChange(currentContent);
  };

  // Title handling - only update local state, no auto-save
  const handleTitleChange = useCallback((newTitle: string) => {
    console.log("useEditorState: Title change triggered with:", newTitle);
    setCurrentTitle(newTitle);
  }, []);

  // Manual save handler
  const handleManualSave = useCallback(() => {
    if (onSave) {
      console.log("useEditorState: Manual save triggered");
      onSave();
      setLastSaved(new Date());
    }
  }, [onSave]);

  return {
    tagInput,
    setTagInput,
    lastSaved,
    setLastSaved,
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
    fetchedTags,
    handleManualSave
  };
}
