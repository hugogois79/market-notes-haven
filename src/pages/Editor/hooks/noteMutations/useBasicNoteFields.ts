
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

  // Update local state when currentNote changes (only sync from database)
  useEffect(() => {
    console.log("useBasicNoteFields: Syncing with database values");
    setLocalTitle(currentNote.title || "");
    setLocalCategory(currentNote.category || "General");
    
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
  }, [currentNote.id, currentNote.title, currentNote.category, currentNote.tradeInfo, currentNote.hasConclusion, currentNote.summary]);

  const handleTitleChange = (title: string) => {
    console.log("useBasicNoteFields: Title change (local only):", title);
    setLocalTitle(title);
    return title;
  };

  const handleCategoryChange = (category: string) => {
    console.log("useBasicNoteFields: Category change (local only):", category);
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
