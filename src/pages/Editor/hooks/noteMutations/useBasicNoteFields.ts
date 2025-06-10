
import { useState, useEffect } from "react";
import { Note, TradeInfo } from "@/types";

interface UseBasicNoteFieldsProps {
  initialTitle: string;
  initialCategory: string;
  initialTradeInfo?: TradeInfo;
  initialSummary?: string;
  initialHasConclusion?: boolean;
}

export const useBasicNoteFields = (currentNote: Note) => {
  const [localTitle, setLocalTitle] = useState(currentNote.title || "");
  const [localCategory, setLocalCategory] = useState(currentNote.category || "General");
  const [localTradeInfo, setLocalTradeInfo] = useState<TradeInfo | undefined>(currentNote.tradeInfo);
  const [hasConclusion, setHasConclusion] = useState(currentNote.hasConclusion ?? true);
  const [summaryState, setSummaryState] = useState({
    summary: currentNote.summary || "",
    hasConclusion: currentNote.hasConclusion ?? true
  });

  // Track if we're in the middle of a category update to prevent overwrites
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  // Update local state when currentNote changes, but preserve user changes
  useEffect(() => {
    // Only update if the note actually changed (different ID or significant change)
    // Don't override user's current edits
    if (currentNote.title !== localTitle && !localTitle.startsWith("Untitled")) {
      setLocalTitle(currentNote.title || "");
    }
    
    // For category, only sync if we're not currently updating it
    // This prevents the race condition where the UI reverts after save
    if (!isUpdatingCategory && currentNote.category !== localCategory) {
      console.log("useBasicNoteFields: Syncing category from database:", currentNote.category);
      setLocalCategory(currentNote.category || "General");
    }
    
    if (currentNote.tradeInfo !== localTradeInfo) {
      setLocalTradeInfo(currentNote.tradeInfo);
    }
    
    if (currentNote.hasConclusion !== hasConclusion) {
      setHasConclusion(currentNote.hasConclusion ?? true);
    }
    
    // Update summary state
    setSummaryState({
      summary: currentNote.summary || "",
      hasConclusion: currentNote.hasConclusion ?? true
    });
  }, [currentNote.id, currentNote.title, currentNote.category, currentNote.tradeInfo, currentNote.hasConclusion, currentNote.summary, isUpdatingCategory]);

  const handleTitleChange = (title: string) => {
    console.log("useBasicNoteFields: Title change:", title);
    setLocalTitle(title);
    return title;
  };

  const handleCategoryChange = (category: string) => {
    console.log("useBasicNoteFields: Category change to:", category);
    
    // Set the updating flag to prevent sync from overwriting
    setIsUpdatingCategory(true);
    
    // Immediately update local state
    setLocalCategory(category);
    
    // Clear the updating flag after a short delay to allow the save to complete
    setTimeout(() => {
      setIsUpdatingCategory(false);
    }, 1000);
    
    return category;
  };

  const handleTradeInfoChange = (tradeInfo: TradeInfo) => {
    setLocalTradeInfo(tradeInfo);
  };

  const handleSummaryGenerated = (summary: string, conclusion?: boolean) => {
    const newHasConclusion = conclusion ?? true;
    setHasConclusion(newHasConclusion);
    setSummaryState({
      summary,
      hasConclusion: newHasConclusion
    });
  };

  return {
    localTitle,
    localCategory,
    localTradeInfo,
    hasConclusion,
    summaryState,
    handleTitleChange,
    handleCategoryChange,
    handleTradeInfoChange,
    handleSummaryGenerated
  };
};
