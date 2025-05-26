
import { useState, useEffect } from "react";
import { Note, TradeInfo } from "@/types";

interface SummaryState {
  summary: string;
  hasConclusion: boolean;
}

export const useBasicNoteFields = (currentNote: Note) => {
  const [localTitle, setLocalTitle] = useState(currentNote.title || "");
  const [localCategory, setLocalCategory] = useState(currentNote.category || "General");
  const [localTradeInfo, setLocalTradeInfo] = useState<TradeInfo | null>(
    currentNote.tradeInfo ? currentNote.tradeInfo as TradeInfo : null
  );
  const [hasConclusion, setHasConclusion] = useState(currentNote.hasConclusion || false);
  const [summaryState, setSummaryState] = useState<SummaryState>({
    summary: currentNote.summary || "",
    hasConclusion: currentNote.hasConclusion || false
  });

  // Update local state when currentNote changes
  useEffect(() => {
    setLocalTitle(currentNote.title || "");
    setLocalCategory(currentNote.category || "General");
    setLocalTradeInfo(currentNote.tradeInfo ? currentNote.tradeInfo as TradeInfo : null);
    setHasConclusion(currentNote.hasConclusion || false);
    setSummaryState({
      summary: currentNote.summary || "",
      hasConclusion: currentNote.hasConclusion || false
    });
  }, [currentNote]);

  const handleTitleChange = (title: string) => {
    console.log("useBasicNoteFields: Title change:", title);
    setLocalTitle(title);
  };

  // FIXED: Enhanced category change handler with immediate save trigger
  const handleCategoryChange = (category: string) => {
    console.log("useBasicNoteFields: Category change:", category);
    setLocalCategory(category);
    
    // Return the new category value so the parent can save it immediately
    return category;
  };

  const handleTradeInfoChange = (tradeInfo: TradeInfo) => {
    console.log("useBasicNoteFields: Trade info change:", tradeInfo);
    setLocalTradeInfo(tradeInfo);
  };

  const handleSummaryGenerated = (summary: string, conclusion?: boolean) => {
    console.log("useBasicNoteFields: Summary generated:", summary);
    const newHasConclusion = conclusion !== undefined ? conclusion : hasConclusion;
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
