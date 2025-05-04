
import { useState } from "react";
import { Note, TradeInfo } from "@/types";

interface SummaryState {
  summary: string;
  hasConclusion: boolean;
}

export const useBasicNoteFields = (currentNote: Note) => {
  const [localTitle, setLocalTitle] = useState(currentNote.title);
  const [localCategory, setLocalCategory] = useState(currentNote.category || "General");
  const [localTradeInfo, setLocalTradeInfo] = useState<TradeInfo | undefined>(currentNote.tradeInfo);
  const [hasConclusion, setHasConclusion] = useState<boolean>(currentNote.hasConclusion !== false);
  const [summaryState, setSummaryState] = useState<SummaryState>({
    summary: currentNote.summary || "",
    hasConclusion: currentNote.hasConclusion !== false
  });

  const handleTitleChange = (title: string) => {
    console.log("NoteEditor: Title changing to:", title);
    setLocalTitle(title);
    return { title };
  };

  const handleCategoryChange = (category: string) => {
    console.log("NoteEditor: Category changing to:", category);
    setLocalCategory(category);
    return { category };
  };

  const handleTradeInfoChange = (tradeInfo: TradeInfo) => {
    console.log("Trade info changed:", tradeInfo);
    setLocalTradeInfo(tradeInfo);
    return { tradeInfo };
  };

  const handleSummaryGenerated = (summary: string, detectedHasConclusion?: boolean) => {
    console.log("Summary generated:", summary);
    console.log("Has conclusion:", detectedHasConclusion);
    
    const newSummaryState: SummaryState = {
      summary,
      hasConclusion: detectedHasConclusion !== undefined ? detectedHasConclusion : hasConclusion
    };
    
    setSummaryState(newSummaryState);
    
    if (detectedHasConclusion !== undefined) {
      setHasConclusion(detectedHasConclusion);
    }
    
    const updates: Partial<Note> = { 
      summary,
      hasConclusion: newSummaryState.hasConclusion
    };
    
    return updates;
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
