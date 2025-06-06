
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
  const [localTradeInfo, setLocalTradeInfo] = useState<TradeInfo | undefined>(currentNote.trade_info);
  const [hasConclusion, setHasConclusion] = useState(currentNote.has_conclusion ?? true);
  const [summaryState, setSummaryState] = useState({
    summary: currentNote.summary || "",
    hasConclusion: currentNote.has_conclusion ?? true
  });

  // Update local state when currentNote changes, but preserve user changes
  useEffect(() => {
    // Only update if the note actually changed (different ID or significant change)
    // Don't override user's current edits
    if (currentNote.title !== localTitle && !localTitle.startsWith("Untitled")) {
      setLocalTitle(currentNote.title || "");
    }
    
    // For category, always sync with the database value to reflect saved state
    setLocalCategory(currentNote.category || "General");
    
    if (currentNote.trade_info !== localTradeInfo) {
      setLocalTradeInfo(currentNote.trade_info);
    }
    
    if (currentNote.has_conclusion !== hasConclusion) {
      setHasConclusion(currentNote.has_conclusion ?? true);
    }
    
    // Update summary state
    setSummaryState({
      summary: currentNote.summary || "",
      hasConclusion: currentNote.has_conclusion ?? true
    });
  }, [currentNote.id, currentNote.title, currentNote.category, currentNote.trade_info, currentNote.has_conclusion, currentNote.summary]);

  const handleTitleChange = (title: string) => {
    console.log("useBasicNoteFields: Title change:", title);
    setLocalTitle(title);
    return title;
  };

  const handleCategoryChange = (category: string) => {
    console.log("useBasicNoteFields: Category change to:", category);
    // Immediately update local state
    setLocalCategory(category);
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
